-- Tabela de pagamentos Turbo (Pix via Mercado Pago)
CREATE TABLE IF NOT EXISTS pagamento_turbo (
    id_pagamento    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario      BIGINT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_jogo         BIGINT NOT NULL REFERENCES jogo(id_jogo) ON DELETE CASCADE,
    valor           NUMERIC(10,2) NOT NULL DEFAULT 4.00,
    status          TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'expirado', 'cancelado')),
    id_pagamento_mp BIGINT,                          -- ID do pagamento no Mercado Pago
    pix_copia_cola  TEXT,                            -- código Pix copia e cola
    pix_qr_code_base64 TEXT,                         -- QR Code em base64 (data URI)
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_em       TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes')
);

-- RLS
ALTER TABLE pagamento_turbo ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado pode ver seus próprios pagamentos
CREATE POLICY pagamento_turbo_select ON pagamento_turbo
    FOR SELECT USING (
        id_usuario IN (
            SELECT id_usuario FROM usuario
            WHERE auth_id = auth.uid()::text
        )
    );

-- Inserts e updates são feitos via service_role (backend), não pelo cliente

