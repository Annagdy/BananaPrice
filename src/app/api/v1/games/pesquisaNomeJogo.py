import sys
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
sys.stdout.reconfigure(encoding="utf-8")

def pesquisarGoogle(busca):
    driver = webdriver.Chrome()

    try:
        driver.get("https://gemini.google.com/app?hl=pt-BR")

        seu_xpath_manual = '//*[@id="xap-skip-link-target"]/div/chat-window/div[2]/input-container/div/input-area-v2/div/fieldset/div/div[1]/div/div/div/rich-textarea/div[1]/p'

        barra_pesquisa = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.XPATH, seu_xpath_manual))
        )

        pergunta = (
            f'Rápido, qual o nome do jogo "{busca}" no isthereanydeal? '
            'OBS: Apenas o nome do jogo (caso seja mais de um, '
            'colocar apenas os nomes separados por ","). '
            'Caso não tiver o jogo responda apenas "NOT JOGO".'
        )

        barra_pesquisa.click()
        barra_pesquisa.send_keys(pergunta)
        time.sleep(2)

        script_clique_botao = """
        let botao = document.querySelector(
            'button[aria-label="Enviar prompt"], button.send-button, .send-button-container button'
        );
        if (botao) {
            botao.click();
            return true;
        }
        return false;
        """

        clicou = driver.execute_script(script_clique_botao)

        if not clicou:
            barra_pesquisa.send_keys(Keys.CONTROL, Keys.ENTER)

        js_validar_conteudo = """
        let blocos = document.querySelectorAll(
            'model-response, .message-content, [data-message-author-role="assistant"]'
        );
        let carregando = document.querySelector(
            'mat-progress-bar, .loading, .generating, [aria-label="Parar geração"]'
        );

        if (blocos.length > 0 && !carregando) {
            let texto = blocos[blocos.length - 1].innerText.trim();

            if (
                texto.length > 0 &&
                texto !== "Pesquisando na internet" &&
                !texto.includes("Buscando fontes")
            ) {
                return texto;
            }
        }

        return null;
        """
        time.sleep(3)
        texto_resposta = ""

        for _ in range(40):
            resultado_js = driver.execute_script(js_validar_conteudo)

            if resultado_js:
                texto_resposta = resultado_js
                break

            time.sleep(1)

        time.sleep(3)

        if not texto_resposta:
            raise TimeoutError("O Gemini demorou muito para responder.")

        return texto_resposta
        
    finally:
        driver.quit()


if __name__ == "__main__":
    try:
        busca = sys.argv[1]
        resultado = pesquisarGoogle(busca)

        print(json.dumps(
            {"nome": resultado},
            ensure_ascii=False
        ))

    except Exception as e:
        print(json.dumps(
            {"erro": str(e)},
            ensure_ascii=False
        ))
        sys.exit(1)