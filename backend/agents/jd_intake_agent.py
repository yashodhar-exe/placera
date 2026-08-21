import re
from typing import Dict, Any, List

# Predefined list of skills to search for
SKILL_DICTIONARY = [
    "Python", "SQL", "JavaScript", "React", "Node.js", "AWS", "Java", "C++", 
    "Excel", "Tableau", "FastAPI", "Docker", "Machine Learning", "Data Structures"
]

BRANCH_DICTIONARY = ["CSE", "ISE", "ECE", "ME", "EEE", "CIVIL"]

class JDIntakeAgent:
    @staticmethod
    def parse_jd(jd_text: str) -> Dict[str, Any]:
        """
        Parses raw job description text and extracts structured fields.
        Returns:
            Dict containing company_name, role_title, required_skills, 
            cgpa_cutoff, eligible_branches, package_min, package_max, 
            headcount, and a matching_explanations dictionary.
        """
        explanations = {}
        
        # 1. Extract Role Title (heuristic based on common patterns)
        role_title = "Software Engineer"
        role_matches = re.findall(
            r"(software engineer|backend engineer|frontend engineer|full stack developer|data analyst|sde intern|data scientist|systems engineer)", 
            jd_text, 
            re.IGNORECASE
        )
        if role_matches:
            role_title = role_matches[0].title()
            explanations["role_title"] = f"Identified role title '{role_title}' from keyword match."
        else:
            explanations["role_title"] = "Fallback default role 'Software Engineer' applied; no specific title matched."

        # 2. Extract Skills (split into required and preferred)
        found_skills = []
        for skill in SKILL_DICTIONARY:
            if re.search(r'\b' + re.escape(skill) + r'\b', jd_text, re.IGNORECASE):
                found_skills.append(skill)
        
        # Split skills: first half as required, second half as preferred
        if len(found_skills) >= 2:
            mid = len(found_skills) // 2
            required = found_skills[:mid]
            preferred = found_skills[mid:]
        elif found_skills:
            required = found_skills
            preferred = []
        else:
            required = ["Python"]
            preferred = ["SQL"]
            
        required_skills = {"required": required, "preferred": preferred}
        explanations["required_skills"] = (
            f"Extracted required skills: {', '.join(required)} and "
            f"preferred skills: {', '.join(preferred)} based on JD vocabulary search."
        )

        # 3. Extract CGPA Cutoff
        cgpa_cutoff = 7.0
        cgpa_match = re.search(
            r"(cgpa\s*cutoff|minimum\s*cgpa|cgpa\s*>=\s*|cutoff\s*of\s*)(\d+\.\d+|\d+)", 
            jd_text, 
            re.IGNORECASE
        )
        if not cgpa_match:
            # Try a simpler decimal look
            cgpa_match = re.search(r"\b([6789]\.\d+)\s*(cgpa|gpa)?\b", jd_text, re.IGNORECASE)
            
        if cgpa_match:
            try:
                cgpa_cutoff = float(cgpa_match.group(1))
            except ValueError:
                # If group 1 isn't the number, take group 2
                try:
                    cgpa_cutoff = float(cgpa_match.group(2))
                except Exception:
                    pass
            explanations["cgpa_cutoff"] = f"Parsed CGPA cutoff as {cgpa_cutoff} from match: '{cgpa_match.group(0)}'."
        else:
            explanations["cgpa_cutoff"] = f"No explicit CGPA cutoff found. Defaulted to {cgpa_cutoff}."

        # 4. Extract Eligible Branches
        eligible_branches = []
        for branch in BRANCH_DICTIONARY:
            if re.search(r'\b' + re.escape(branch) + r'\b', jd_text, re.IGNORECASE):
                eligible_branches.append(branch)
        if not eligible_branches:
            eligible_branches = ["CSE", "ISE"]
            explanations["eligible_branches"] = f"No branches found. Defaulted to {eligible_branches}."
        else:
            explanations["eligible_branches"] = f"Extracted eligible branches: {eligible_branches}."

        # 5. Extract Package (Min / Max)
        package_min = 5.0
        package_max = 8.0
        package_match = re.search(
            r"(\d+(\.\d+)?)\s*(?:-|to)\s*(\d+(\.\d+)?)\s*(?:lpa|lakhs|lakh|per annum)", 
            jd_text, 
            re.IGNORECASE
        )
        if package_match:
            try:
                package_min = float(package_match.group(1))
                package_max = float(package_match.group(3))
                explanations["package"] = f"Extracted package range: {package_min} - {package_max} LPA."
            except Exception:
                pass
        else:
            # Single value match
            single_match = re.search(r"(\d+(\.\d+)?)\s*(?:lpa|lakhs)", jd_text, re.IGNORECASE)
            if single_match:
                try:
                    val = float(single_match.group(1))
                    package_min = val
                    package_max = val + 2.0
                    explanations["package"] = f"Extracted base package: {package_min} LPA, estimated range: {package_min} - {package_max} LPA."
                except Exception:
                    pass
            else:
                explanations["package"] = f"No package details found. Defaulted to range {package_min} - {package_max} LPA."

        # 6. Extract Headcount
        headcount = 5
        headcount_match = re.search(
            r"(\d+)\s*(?:openings|vacancies|positions|headcount|hiring)", 
            jd_text, 
            re.IGNORECASE
        )
        if headcount_match:
            try:
                headcount = int(headcount_match.group(1))
                explanations["headcount"] = f"Parsed headcount of {headcount} from matching phrase '{headcount_match.group(0)}'."
            except Exception:
                pass
        else:
            explanations["headcount"] = f"No headcount specified. Defaulted to {headcount} openings."

        # Extract Company Name (Heuristic: first capitalized words or default)
        company_name = "Tech Recruiter Partner"
        company_match = re.search(r"(?:hiring for|joining|at)\s+([A-Z][a-zA-Z0-9\s]{2,15})", jd_text)
        if company_match:
            company_name = company_match.group(1).strip()
            explanations["company_name"] = f"Extracted company name: '{company_name}'."
        else:
            explanations["company_name"] = "Fallback default company name applied."

        return {
            "company_name": company_name,
            "role_title": role_title,
            "required_skills": required_skills,
            "cgpa_cutoff": cgpa_cutoff,
            "eligible_branches": eligible_branches,
            "package_min": package_min,
            "package_max": package_max,
            "headcount": headcount,
            "explanations": explanations
        }
