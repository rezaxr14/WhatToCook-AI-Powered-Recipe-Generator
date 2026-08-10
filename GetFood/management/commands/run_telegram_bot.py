import logging
import os
import time
import requests
from django.conf import settings
from django.core.management.base import BaseCommand
from django.test import RequestFactory
from GetFood.views import api_telegram_webhook

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Runs the WhatToCook Telegram Bot background polling service.'

    def handle(self, *args, **options):
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '') or os.getenv('TELEGRAM_BOT_TOKEN', '')
        bot_username = getattr(settings, 'TELEGRAM_BOT_USERNAME', 'WhatToCookChefBot') or os.getenv('TELEGRAM_BOT_USERNAME', 'WhatToCookChefBot')

        if not bot_token or bot_token == 'your_telegram_bot_token_here':
            self.stdout.write(self.style.WARNING(
                f"⚡ Telegram Bot Service: No valid TELEGRAM_BOT_TOKEN provided in .env.\n"
                f"ℹ️ Set TELEGRAM_BOT_TOKEN in .env to activate live Telegram polling for @{bot_username}.\n"
                f"😴 Service is in standby mode..."
            ))
            try:
                while True:
                    time.sleep(30)
            except KeyboardInterrupt:
                return

        self.stdout.write(self.style.SUCCESS(
            f"🚀 WhatToCook Telegram Bot polling service started for @{bot_username}!\n"
            f"Listening for updates..."
        ))

        # Delete any conflicting webhook before polling
        try:
            requests.get(f"https://api.telegram.org/bot{bot_token}/deleteWebhook?drop_pending_updates=False", timeout=10)
        except Exception as e:
            logger.warning(f"Error resetting Telegram webhook: {e}")

        offset = 0
        factory = RequestFactory()

        while True:
            try:
                url = f"https://api.telegram.org/bot{bot_token}/getUpdates?offset={offset}&timeout=20"
                resp = requests.get(url, timeout=30)
                if resp.status_code == 200:
                    data = resp.json()
                    updates = data.get('result', [])
                    for update in updates:
                        offset = update.get('update_id', offset) + 1
                        try:
                            # Forward update directly to the webhook handler
                            req = factory.post(
                                '/api/telegram/webhook/',
                                data=update,
                                content_type='application/json'
                            )
                            api_telegram_webhook(req)
                        except Exception as e:
                            logger.error(f"Error processing Telegram update: {e}")
                elif resp.status_code == 409:
                    # Conflict: another instance is running
                    self.stdout.write(self.style.WARNING("Telegram conflict: webhook or another poll active. Retrying..."))
                    time.sleep(5)
                else:
                    time.sleep(2)
            except Exception as e:
                logger.warning(f"Telegram polling loop error: {e}")
                time.sleep(3)
