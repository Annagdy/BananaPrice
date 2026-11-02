import sys
import json
import os
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import (
    TimeoutException,
    StaleElementReferenceException,
    WebDriverException
)


sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")


def log(mensagem):
    print(mensagem, file=sys.stderr, flush=True)


def normalizar_texto(texto):
    return " ".join(texto.split())


def encontrar_caixa_de_texto(driver):
    seletores = [
        (By.ID, "prompt-textarea"),
        (By.CSS_SELECTOR, "div[contenteditable='true'][id='prompt-textarea']"),
        (By.CSS_SELECTOR, "div[contenteditable='true'][role='textbox']"),
        (By.CSS_SELECTOR, "textarea")
    ]

    for by, seletor in seletores:
        elementos = driver.find_elements(by, seletor)

        for elemento in elementos:
            try:
                if elemento.is_displayed() and elemento.is_enabled():
                    return elemento
            except StaleElementReferenceException:
                continue

    raise Exception("Caixa de texto do ChatGPT não encontrada.")


def obter_conteudo_caixa(driver, caixa):
    return driver.execute_script("""
        const elemento = arguments[0];

        if (elemento.tagName === 'TEXTAREA' ||
            elemento.tagName === 'INPUT') {
            return elemento.value || '';
        }

        return elemento.innerText || '';
    """, caixa)


def inserir_texto(driver, caixa, texto):
    log("Inserindo pergunta completa...")

    caixa.click()
    caixa.send_keys(Keys.CONTROL, "a")
    caixa.send_keys(Keys.BACKSPACE)

    driver.execute_cdp_cmd(
        "Input.insertText",
        {"text": texto}
    )

    # log("Confirmando inserção...")
    # caixa.send_keys(" ")
    caixa.send_keys(Keys.BACKSPACE)

    try:
        WebDriverWait(driver, 15).until(
            lambda d: (
                normalizar_texto(
                    obter_conteudo_caixa(
                        d,
                        encontrar_caixa_de_texto(d)
                    )
                )
                == normalizar_texto(texto)
            )
        )

    except TimeoutException:
        conteudo = obter_conteudo_caixa(
            driver,
            encontrar_caixa_de_texto(driver)
        )

        log("ERRO: A pergunta não foi inserida completamente.")
        log(f"Tamanho esperado: {len(texto)}")
        log(f"Tamanho encontrado: {len(conteudo)}")

        raise Exception(
            "Não foi possível confirmar a inserção completa. "
            "O envio foi cancelado."
        )

    log("Pergunta completa inserida e confirmada.")


def enviar_pergunta(driver, caixa):
    seletores = [
        "button[data-testid='send-button']",
        "button[data-testid='composer-send-button']",
        "button[aria-label='Enviar mensagem']",
        "button[aria-label='Send message']",
        "button[aria-label='Send prompt']"
    ]

    for seletor in seletores:
        try:
            botoes = driver.find_elements(By.CSS_SELECTOR, seletor)

            for botao in botoes:
                if botao.is_displayed() and botao.is_enabled():
                    botao.click()
                    log("Pergunta enviada pelo botão.")
                    return

        except StaleElementReferenceException:
            continue

    log("Botão não encontrado. Tentando enviar com Enter.")
    caixa.send_keys(Keys.ENTER)


def obter_blocos_resposta(driver):
    script = """
        const seletores = [
            'article[data-turn="assistant"]',
            '[data-message-author-role="assistant"]',
            '[data-message-role="assistant"]',
            '[data-role="assistant"]',
            '.agent-turn'
        ];

        const encontrados = new Set();

        for (const seletor of seletores) {
            document.querySelectorAll(seletor).forEach(elemento => {
                encontrados.add(elemento);
            });
        }

        const elementos = Array.from(encontrados).filter(elemento => {
            const estilo = window.getComputedStyle(elemento);
            const texto = elemento.innerText || '';

            return (
                estilo.display !== 'none' &&
                estilo.visibility !== 'hidden' &&
                elemento.getBoundingClientRect().height > 0 &&
                texto.trim().length > 0
            );
        });

        const blocos = elementos.filter(elemento => {
            return !elementos.some(outro =>
                outro !== elemento && elemento.contains(outro)
            );
        });

        return blocos.map(elemento => {
            const conteudo = elemento.querySelector(
                '.markdown, .prose, [class*="markdown"]'
            );

            return {
                texto: (conteudo || elemento).innerText.trim()
            };
        }).filter(bloco => bloco.texto.length > 0);
    """

    try:
        return driver.execute_script(script)

    except (StaleElementReferenceException, WebDriverException):
        return []


def obter_ultimo_texto(driver):
    blocos = obter_blocos_resposta(driver)

    if not blocos:
        return ""

    return blocos[-1]["texto"]


def esta_gerando(driver):
    seletores = [
        "button[data-testid='stop-button']",
        "button[data-testid='stop-generating-button']",
        "button[aria-label='Stop generating']",
        "button[aria-label='Parar de gerar']",
        "button[aria-label='Stop']",
        "button[aria-label='Parar']"
    ]

    for seletor in seletores:
        try:
            botoes = driver.find_elements(By.CSS_SELECTOR, seletor)

            for botao in botoes:
                try:
                    if botao.is_displayed():
                        return True
                except StaleElementReferenceException:
                    continue

        except WebDriverException:
            continue

    return False


def obter_resposta_final(
    driver,
    quantidade_anterior,
    texto_anterior,
    timeout=300
):
    log("Aguardando a resposta completa antes da próxima busca...")

    inicio = time.time()
    ultimo_texto = ""
    inicio_estabilidade = None
    nova_resposta_encontrada = False

    intervalo = 0.3
    estabilidade_necessaria = 2.0

    while time.time() - inicio < timeout:
        try:
            blocos = obter_blocos_resposta(driver)

            if not blocos:
                time.sleep(intervalo)
                continue

            texto_atual = blocos[-1]["texto"].strip()

            # Confirma que apareceu uma resposta nova.
            if not nova_resposta_encontrada:
                resposta_nova = (
                    len(blocos) > quantidade_anterior
                    or (
                        texto_atual
                        and texto_atual != texto_anterior
                    )
                )

                if not resposta_nova:
                    time.sleep(intervalo)
                    continue

                nova_resposta_encontrada = True
                log("Nova resposta detectada.")

            if not texto_atual:
                time.sleep(intervalo)
                continue

            # Qualquer mudança reinicia a contagem de estabilidade.
            if texto_atual != ultimo_texto:
                ultimo_texto = texto_atual
                inicio_estabilidade = None

            else:
                gerando = esta_gerando(driver)

                if gerando:
                    inicio_estabilidade = None

                else:
                    if inicio_estabilidade is None:
                        inicio_estabilidade = time.time()

                    elif (
                        time.time() - inicio_estabilidade
                        >= estabilidade_necessaria
                    ):
                        log("Resposta concluída:")
                        log(texto_atual)

                        return texto_atual

        except StaleElementReferenceException:
            inicio_estabilidade = None

        time.sleep(intervalo)

    raise TimeoutException(
        "O tempo limite foi atingido aguardando a resposta completa "
        "do ChatGPT. A próxima pergunta não foi enviada."
    )


class CaixaNaoEncontrada(Exception):
    """A página abriu, mas a caixa de texto do ChatGPT não apareceu a tempo."""


def criar_driver(modo):
    """Abre o Chrome de acordo com o modo pedido.

    - "headless": sem janela nenhuma (nada aparece na tela nem na barra de tarefas).
    - "fora":     janela normal, mas posicionada fora da área visível do monitor.
    - "visivel":  janela maximizada, como antes (útil para depurar).
    """
    options = webdriver.ChromeOptions()
    options.add_argument("--lang=pt-BR")

    if modo == "headless":
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1366,900")

    elif modo == "fora":
        options.add_argument("--window-position=-32000,-32000")
        options.add_argument("--window-size=1366,900")

    else:
        options.add_argument("--start-maximized")

    return webdriver.Chrome(options=options)


def aguardar_caixa(driver, timeout):
    """Espera a caixa de texto aparecer. Devolve True se apareceu, False se o tempo acabou."""
    limite = time.time() + timeout

    while time.time() < limite:
        try:
            encontrar_caixa_de_texto(driver)
            return True

        except Exception:
            time.sleep(0.5)

    return False


def _pesquisar_com_janela(busca, modo):
    driver = None

    try:
        driver = criar_driver(modo)

        driver.set_page_load_timeout(120)
        driver.get("https://chatgpt.com/")

        log("Aguardando o ChatGPT carregar...")

        # Sem janela, 45 s bastam para saber se o ChatGPT carregou ou se bloqueou o modo
        espera = 45 if modo == "headless" else 300

        if not aguardar_caixa(driver, espera):
            raise CaixaNaoEncontrada(
                "A caixa de texto não apareceu. "
                f"Título da página: {driver.title!r}"
            )

        log("ChatGPT carregado.")

        pergunta = f"""
Pesquise no IsThereAnyDeal todos os jogos relacionados ao termo "{busca}".

Quero os nomes dos jogos que correspondam à pesquisa, incluindo:
- Jogos com o nome pesquisado.
- Jogos da mesma franquia.
- Sequências e prequelas.
- Remakes e remasters.
- Spin-offs.
- Edições diferentes do mesmo jogo, quando existirem no IsThereAnyDeal.

Considere os nomes utilizados no catálogo do IsThereAnyDeal.

Retorne somente os nomes dos jogos, separados por vírgulas.
Não inclua explicações, introduções, comentários ou links.

Se nenhum jogo relacionado for encontrado, responda exatamente:
NOT JOGO
"""

        pergunta_repetida = f"""
Faça uma nova verificação no IsThereAnyDeal para a pesquisa "{busca}".

Procure cuidadosamente todos os jogos relacionados ao termo pesquisado,
incluindo títulos da mesma franquia, sequências, prequelas, remakes,
remasters, spin-offs e edições disponíveis.

Retorne somente os nomes dos jogos encontrados, separados por vírgulas.
Não escreva explicações ou qualquer texto adicional.

Se nenhum jogo for encontrado, responda exatamente:
NOT JOGO
"""

        pergunta_final = f"""
Há algum jogo relacionado a "{busca}" no IsThereAnyDeal?

Verifique os títulos disponíveis, incluindo jogos da mesma franquia,
sequências, prequelas, remakes, remasters, spin-offs e edições diferentes.

Retorne apenas os nomes dos jogos separados por vírgulas.
Não acrescente explicações.

Caso não encontre nenhum jogo, responda exatamente:
NOT JOGO
"""

        perguntas = [
            pergunta,
            pergunta_repetida,
            pergunta_final
        ]

        for tentativa, pergunta_atual in enumerate(perguntas, start=1):

            log(f"Iniciando busca {tentativa}/3.")

            # Guarda o estado da conversa ANTES de enviar a pergunta.
            blocos_anteriores = obter_blocos_resposta(driver)
            quantidade_anterior = len(blocos_anteriores)

            texto_anterior = (
                blocos_anteriores[-1]["texto"]
                if blocos_anteriores
                else ""
            )

            caixa = encontrar_caixa_de_texto(driver)

            inserir_texto(
                driver,
                caixa,
                pergunta_atual
            )

            enviar_pergunta(driver, caixa)

            log(
                f"Pergunta {tentativa}/3 enviada. "
                "Aguardando a resposta antes de continuar."
            )

            # A execução fica bloqueada aqui até a resposta terminar.
            resultado = obter_resposta_final(
                driver,
                quantidade_anterior,
                texto_anterior,
                timeout=300
            )

            resultado = resultado.strip()

            log(f"Resultado da busca {tentativa}/3:")
            log(resultado)

            # Só retorna imediatamente se encontrou algum resultado.
            if "NOT JOGO" not in resultado.upper():
                return resultado

            if tentativa < 3:
                log(
                    "Resposta recebida: NOT JOGO. "
                    "A próxima busca será iniciada agora."
                )

        return "NOT JOGO"

    finally:
        if driver is not None:
            log("Encerrando o Chrome...")

            try:
                driver.quit()
                log("Chrome encerrado.")

            except Exception as erro:
                log(f"Erro ao fechar o Chrome: {erro}")

            finally:
                try:
                    driver.service.stop()
                except Exception:
                    pass


def pesquisarChatGPT(busca):
    """Pesquisa no ChatGPT sem mostrar o Chrome.

    O modo vem da variável de ambiente PESQUISA_JANELA:
    - "headless" (padrão): sem janela. Se o ChatGPT não carregar assim, tenta o modo "fora".
    - "fora":    janela fora da área visível do monitor.
    - "visivel": janela normal maximizada (para depurar).
    """
    pedido = os.environ.get("PESQUISA_JANELA", "headless").strip().lower()

    ordem = {
        "headless": ["headless", "fora"],
        "fora": ["fora"],
        "visivel": ["visivel"],
    }.get(pedido, ["headless", "fora"])

    ultimo_erro = None

    for modo in ordem:
        try:
            log(f"Abrindo o Chrome no modo '{modo}'...")
            return _pesquisar_com_janela(busca, modo)

        except CaixaNaoEncontrada as erro:
            ultimo_erro = erro
            log(f"Modo '{modo}' não funcionou: {erro}")

    raise ultimo_erro


if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            raise Exception("Informe o nome do jogo para pesquisar.")

        busca = " ".join(sys.argv[1:]).strip()

        log("======================================")
        log(f"Busca original: {busca}")

        resultado = pesquisarChatGPT(busca)

        print(json.dumps(
            {"nome": resultado},
            ensure_ascii=False
        ))

    except Exception as erro:
        log(f"Erro durante a pesquisa: {erro}")

        print(json.dumps(
            {"erro": str(erro)},
            ensure_ascii=False
        ))