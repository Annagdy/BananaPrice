
import sys
import json
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException

sys.stdout.reconfigure(encoding="utf-8")


def encontrar_caixa_de_texto(driver, timeout=40):
    seletores = [
        (By.CSS_SELECTOR, "rich-textarea [contenteditable='true']"),
        (By.CSS_SELECTOR, "div[contenteditable='true'][role='textbox']"),
        (By.XPATH, "//div[@contenteditable='true']"),
        (By.CSS_SELECTOR, "rich-textarea"),
        (By.XPATH, "//textarea"),
    ]

    limite = time.time() + timeout

    while time.time() < limite:
        for tipo, seletor in seletores:
            try:
                elementos = driver.find_elements(tipo, seletor)

                for elemento in elementos:
                    if elemento.is_displayed() and elemento.is_enabled():
                        return elemento

            except StaleElementReferenceException:
                continue

        time.sleep(0.5)

    raise TimeoutException(
        "Não foi possível localizar a caixa de texto do Gemini."
    )


def inserir_texto(elemento, texto):
    elemento.click()
    elemento.send_keys(Keys.CONTROL, "a")
    elemento.send_keys(Keys.BACKSPACE)
    elemento.send_keys(texto)

    conteudo = (
        elemento.get_attribute("value")
        or elemento.get_attribute("textContent")
        or elemento.get_attribute("innerText")
        or ""
    )

    if texto not in conteudo:
        raise RuntimeError(
            "O Selenium encontrou o campo, mas não confirmou "
            "a inserção da pergunta."
        )


def enviar_pergunta(driver, caixa):
    time.sleep(1)

    clicou = driver.execute_script("""
        const botoes = [...document.querySelectorAll('button')];

        const botao = botoes.find(b => {
            const label = (
                (b.getAttribute('aria-label') || '') + ' ' +
                (b.getAttribute('data-tooltip') || '')
            ).toLowerCase();

            return (
                label.includes('enviar') ||
                label.includes('send') ||
                label.includes('submit')
            );
        });

        if (botao && !botao.disabled) {
            botao.click();
            return true;
        }

        return false;
    """)

    if not clicou:
        caixa.send_keys(Keys.CONTROL, Keys.ENTER)


def pesquisarGoogle(busca):
    if not busca or not busca.strip():
        raise ValueError("O termo de pesquisa está vazio.")

    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--lang=pt-BR")

    driver = webdriver.Chrome(options=options)

    try:
        driver.get("https://gemini.google.com/app?hl=pt-BR")

        caixa = encontrar_caixa_de_texto(driver)

        pergunta = (
            f'Pesquise no catálogo do IsThereAnyDeal (ITAD) todos os jogos relacionados ao termo "{busca}". '

            'A pesquisa deve seguir obrigatoriamente estas etapas: '

            '1. Encontre todos os jogos cujo título corresponda ao termo pesquisado, preservando seus nomes oficiais e exatos. '

            '2. Encontre todos os outros jogos pertencentes à mesma franquia, série ou universo dos jogos encontrados, incluindo spin-offs e títulos derivados. '

            '3. Encontre todas as continuações (sequências), prequelas e demais jogos que deem continuidade à franquia ou à história dos jogos identificados. '

            f'4. Pesquise também todos os jogos disponíveis no IsThereAnyDeal que contenham "{busca}" em qualquer parte do título, mesmo que não tenham relação com a franquia ou com o jogo original. '

            'REGRAS OBRIGATÓRIAS: '
            '- Consulte exclusivamente jogos que estejam disponíveis no catálogo do IsThereAnyDeal. '
            '- Não invente nomes nem inclua jogos que não estejam no catálogo. '
            '- Não limite a pesquisa aos primeiros resultados. '
            '- Não ignore jogos relacionados, continuações, prequelas ou spin-offs. '
            '- Elimine nomes duplicados. '
            '- Preserve a grafia oficial dos títulos, incluindo números, subtítulos e caracteres especiais. '
            '- Se não encontrar resultados inicialmente, repita a pesquisa usando variações do termo pesquisado e verificando outras grafias. '

            'FORMATO DA RESPOSTA: '
            'Retorne exclusivamente os nomes exatos dos jogos encontrados, separados por vírgulas. '
            'Não inclua explicações, categorias, numeração, links ou qualquer texto adicional. '
            'Se, após repetir a pesquisa, nenhum jogo for encontrado, responda exatamente: NOT JOGO.'
        )

        pergunta_repetida = (
            f'Verifique novamente de forma bem minuciosa se no catálogo do IsThereAnyDeal (ITAD) há algum jogo que contenha o nome "{busca}" em seu título, ou que seja relacionado ao termo "{busca}" ou ao jogo {busca}! '
            'Se houver, traga os nomes dos jogos separados por vírgulas (,), caso não tenha, retorne apenas a string "NOT JOGO".'
        )

        pergunta_final = (
            f'Há algum jogo de {busca} na isthereanydeall? Procure a resposta em todos os sites que puder.'
            'Se houver, traga os nomes dos jogos separados por vírgulas (,), caso não tenha, retorne apenas a string "NOT JOGO".'
        )

        seletores_resposta = [
            (By.CSS_SELECTOR, "model-response"),
            (By.CSS_SELECTOR, "[data-message-author-role='assistant']"),
            (By.CSS_SELECTOR, ".message-content"),
        ]

        def obter_blocos_resposta(d):
            blocos_encontrados = []

            for tipo, seletor in seletores_resposta:
                try:
                    blocos = d.find_elements(tipo, seletor)

                    for bloco in blocos:
                        if bloco.is_displayed():
                            if bloco not in blocos_encontrados:
                                blocos_encontrados.append(bloco)

                    if blocos_encontrados:
                        return blocos_encontrados

                except StaleElementReferenceException:
                    continue

            return []

        def obter_resposta_nova(d, quantidade_anterior):
            blocos = obter_blocos_resposta(d)

            if len(blocos) <= quantidade_anterior:
                return False

            try:
                bloco = blocos[-1]
                texto = (bloco.text or "").strip()

                if (
                    not texto
                    or texto == pergunta
                    or texto == pergunta_repetida
                    or "Buscando fontes" in texto
                    or "Pesquisando na internet" in texto
                ):
                    return False

                return texto

            except StaleElementReferenceException:
                return False

        espera = WebDriverWait(driver, 120, poll_frequency=1)

        for tentativa in range(1, 4):

            quantidade_anterior = len(obter_blocos_resposta(driver))

            caixa = encontrar_caixa_de_texto(driver)

            # Primeira tentativa usa a pergunta original.
            # Segunda e terceira usam a pergunta de verificação.
            
            if tentativa == 1:
                pergunta_atual = pergunta
            elif tentativa == 2:
                pergunta_atual = pergunta_repetida
            else:
                pergunta_atual = pergunta_final

            inserir_texto(caixa, pergunta_atual)
            enviar_pergunta(driver, caixa)

            print(
                f"Pergunta enviada. Tentativa {tentativa}/3.",
                file=sys.stderr
            )

            texto_resposta = espera.until(
                lambda d: obter_resposta_nova(d, quantidade_anterior)
            )

            anterior = ""
            repeticoes = 0

            for _ in range(30):
                atual = obter_resposta_nova(
                    driver,
                    quantidade_anterior
                )

                if atual and atual == anterior:
                    repeticoes += 1

                    if repeticoes >= 3:
                        texto_resposta = atual
                        break
                else:
                    repeticoes = 0

                    if atual:
                        texto_resposta = atual

                anterior = atual or ""
                time.sleep(1)

            texto_resposta = texto_resposta.strip()

            if not texto_resposta:
                raise TimeoutException(
                    "O Gemini não retornou uma resposta válida."
                )

            # Na terceira tentativa, aceita qualquer resposta.
            if tentativa == 3:
                return texto_resposta

            # Só repete se a resposta contiver NOT JOGO.
            if "NOT JOGO" not in texto_resposta.upper():
                return texto_resposta

            print(
                f"NOT JOGO recebido. Preparando tentativa "
                f"{tentativa + 1}/3...",
                file=sys.stderr
            )

            time.sleep(2)

        return texto_resposta

    finally:
        driver.quit()


if __name__ == "__main__":
    try:
        busca = " ".join(sys.argv[1:]).strip()
        resultado = pesquisarGoogle(busca)

        print(json.dumps(
            {"nome": resultado},
            ensure_ascii=False
        ))

    except Exception as erro:
        print(json.dumps(
            {"erro": str(erro)},
            ensure_ascii=False
        ))
        sys.exit(1)
