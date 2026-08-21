import os
from google import genai
from pydantic import BaseModel
from typing import List, Optional

class JDRequirements(BaseModel):
    role: str
    skills_mandatory: List[str]
    skills_preferred: List[str]
    cgpa_cutoff: Optional[float] = None
    allowed_branches: Optional[List[str]] = None
    max_backlogs: Optional[int] = None
    allow_prior_offers: bool = False

class JDIntakeAgent:
    def __init__(self):
        # We need a valid API key from env, but for local tests we can mock if missing
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def parse_jd(self, jd_text: str) -> JDRequirements:
        if not self.client:
            # Mock parsing for local dev without key
            return JDRequirements(
                role="Software Engineer (Mocked)",
                skills_mandatory=["Python", "React"],
                skills_preferred=["AWS"],
                cgpa_cutoff=7.5,
                allowed_branches=["CSE", "ECE"],
                max_backlogs=0,
                allow_prior_offers=False
            )
            
        prompt = f"""
        Extract the following structured requirements from the job description text below.
        Return a JSON object conforming to this schema:
        {{
            "role": "Job Title",
            "skills_mandatory": ["skill1", "skill2"],
            "skills_preferred": ["skill3"],
            "cgpa_cutoff": 7.5 (float, null if none),
            "allowed_branches": ["CSE", "ECE"] (list of strings, null if open to all),
            "max_backlogs": 0 (integer, null if no limit),
            "allow_prior_offers": false (boolean)
        }}
        
        Job Description:
        {jd_text}
        """
        
        try:
            response = self.client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': JDRequirements,
                }
            )
            
            # The SDK will automatically parse the response according to the schema
            return response.parsed
        except Exception as e:
            print(f"Error parsing JD with Gemini: {e}")
            # Fallback to mock
            return JDRequirements(
                role="Unknown Role (Fallback)",
                skills_mandatory=[],
                skills_preferred=[],
            )
