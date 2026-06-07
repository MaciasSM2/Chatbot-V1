#!/bin/sh

# @file inject-webhook.sh
# @description Inyector atomico para simular trafico real de Meta API v21.0.
# Calcula firma digital HMAC SHA-256 en caliente y bombardea endpoint perimetral.

set -e

TARGET_PHONE="573149999999"
USER_TEXT="Hola, requiero liquidar el flete de un camion Turbo desde Medellin hasta Rionegro"
APP_SECRET="meta_app_crypto_verification_hash_2026"

echo "======================================================================="
echo "COMPILING ATOMIC META PAYLOAD FOR PHONE: $TARGET_PHONE"
echo "======================================================================="

PAYLOAD_JSON=$(cat <<EOF
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "888888888888888",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "573000000000",
              "phone_number_id": "573000000000"
            },
            "contacts": [{ "profile": { "name": "Sebastian Macias" }, "wa_id": "$TARGET_PHONE" }],
            "messages": [
              {
                "from": "$TARGET_PHONE",
                "id": "wamid.HBgLNTczMTQ5OTk5OTk5FgoSNDM4OEUzNjM4MzZDRDNDREVB",
                "timestamp": "$(date +%s)",
                "text": { "body": "$USER_TEXT" },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
EOF
)

# 2. CALCULAR LA FIRMA CRIPTOGRAFICA EN CALIENTE
HEX_SIGNATURE=$(echo -n "$PAYLOAD_JSON" | openssl dgst -sha256 -hmac "$APP_SECRET" | sed 's/^.*= //')

echo "Firma Criptografica Generada (X-Hub-Signature-256):"
echo "   sha256=$HEX_SIGNATURE"
echo "-----------------------------------------------------------------------"

# 3. DISPARAR PAYLOAD HACIA EL PROXY REVERSO NGINX
echo "Despachando bytes hacia la frontera perimetral HTTP Express 5..."
curl -X POST http://localhost/api/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$HEX_SIGNATURE" \
  -H "X-Correlation-ID: FORENSIC-INJECT-$(date +%s)" \
  -d "$PAYLOAD_JSON"

echo ""
echo "[Injection Protocol Concluded] Revisa los logs de Docker para validar la transicion de la FSM."
