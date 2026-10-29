
import sys
import json
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
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

    # Confirma se o texto foi inserido no campo.
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

    # Tenta enviar pelo botão da interface.
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

    # Alternativa caso o botão não seja encontrado.
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

        # String original da pergunta.
        pergunta = (
            f'Atualmente quais são os nomes exatos dos jogos da {busca}, os relacionados diretamente ao {busca} e os que são continuação deles que consigo encontrar no isthereanydeal?'
            'OBS: Apenas o nome do jogo (caso seja mais de um, '
            'colocar apenas os nomes separados por ","). Caso não encontre nada, responda apenas "NOT JOGO"'
        )

        inserir_texto(caixa, pergunta)
        enviar_pergunta(driver, caixa)

        # Aguarda uma resposta diferente da pergunta enviada.
        seletores_resposta = [
            (By.CSS_SELECTOR, "model-response"),
            (By.CSS_SELECTOR, "[data-message-author-role='assistant']"),
            (By.CSS_SELECTOR, ".message-content"),
        ]

        def obter_resposta(d):
            for tipo, seletor in seletores_resposta:
                try:
                    blocos = d.find_elements(tipo, seletor)

                    for bloco in reversed(blocos):
                        if not bloco.is_displayed():
                            continue

                        texto = (bloco.text or "").strip()

                        if (
                            texto
                            and texto != pergunta
                            and "Buscando fontes" not in texto
                            and texto != "Pesquisando na internet"
                        ):
                            return texto

                except StaleElementReferenceException:
                    continue

            return False

        espera = WebDriverWait(driver, 120, poll_frequency=1)
        texto_resposta = espera.until(obter_resposta)

        # Espera a resposta parar de mudar antes de capturá-la.
        anterior = ""
        repeticoes = 0

        for _ in range(20):
            atual = obter_resposta(driver)

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
