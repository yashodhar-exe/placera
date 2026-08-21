import os

class NotificationAgent:
    def __init__(self):
        self.provider_key = os.getenv("EMAIL_PROVIDER_API_KEY", "mock_key")
        
    def send_notification(self, recipient: str, subject: str, message: str):
        """
        Mock notification sender for the MVP.
        In a real app, this would integrate with SendGrid, Twilio, etc.
        """
        print(f"--- MOCK NOTIFICATION ---")
        print(f"To: {recipient}")
        print(f"Subject: {subject}")
        print(f"Message:\n{message}")
        print(f"-------------------------")
        return True
