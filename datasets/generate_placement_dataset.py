import pandas as pd
from faker import Faker
import random
fake=Faker("en_IN")
N=500
students=[]
for i in range(N):
    fn,ln=fake.first_name(),fake.last_name()
    students.append({"student_email":f"{fn.lower()}.{ln.lower()}{i}@example.com",
                     "name":f"{fn} {ln}","cgpa":round(random.uniform(6,10),2)})
pd.DataFrame(students).to_csv("students.csv",index=False)

def rel(name, rows):
    pd.DataFrame(rows).to_csv(name,index=False)

skills=["Python","Java","SQL","React","C++"]
projects=["AI Chatbot","Weather App","Portal"]
skill_rows=[];proj_rows=[];cert=[];intern=[];hack=[];coding=[];ach=[]
for s in students:
    for sk in random.sample(skills,random.randint(2,5)):
        skill_rows.append({"student_email":s["student_email"],"skill_name":sk,"proficiency":random.randint(1,5)})
    proj_rows.append({"student_email":s["student_email"],"title":random.choice(projects),"description":fake.sentence(),"domain_tags":"AI,Web"})
    cert.append({"student_email":s["student_email"],"certificate_name":"Python","issuer":"Coursera"})
    intern.append({"student_email":s["student_email"],"company_name":"Infosys","role":"Intern"})
    hack.append({"student_email":s["student_email"],"hackathon_name":"SIH","position":"Participant"})
    coding.append({"student_email":s["student_email"],"leetcode_rating":random.randint(900,2200)})
    ach.append({"student_email":s["student_email"],"achievement_title":"Best Project"})
rel("student_skills.csv",skill_rows);rel("student_projects.csv",proj_rows)
rel("student_certifications.csv",cert);rel("student_internships.csv",intern)
rel("student_hackathons.csv",hack);rel("student_coding_profiles.csv",coding)
rel("student_achievements.csv",ach)

companies=[{"company_id":i+1,"company_name":n} for i,n in enumerate(["Google","Microsoft","Amazon","Infosys","TCS"])]
rel("companies.csv",companies)
jobs=[];apps=[];inter=[];place=[]
for i,c in enumerate(companies,1):
    jobs.append({"job_id":i,"company_id":c["company_id"],"role":"SDE"})
for s in students:
    j=random.randint(1,len(jobs))
    apps.append({"student_email":s["student_email"],"job_id":j,"status":"Applied"})
    inter.append({"student_email":s["student_email"],"job_id":j,"technical_score":random.randint(40,100)})
    place.append({"student_email":s["student_email"],"job_id":j,"selected":random.choice([True,False])})
rel("jobs.csv",jobs);rel("applications.csv",apps);rel("interviews.csv",inter);rel("placements.csv",place)

apt=[];att=[];sem=[];pref=[];mock=[]
for s in students:
    apt.append({"student_email":s["student_email"],"quant":random.randint(40,100),"logical":random.randint(40,100),"verbal":random.randint(40,100)})
    att.append({"student_email":s["student_email"],"attendance":round(random.uniform(65,100),2)})
    for semno in range(1,9):
        sem.append({"student_email":s["student_email"],"semester":semno,"sgpa":round(random.uniform(6,10),2)})
    pref.append({"student_email":s["student_email"],"preferred_role":"Software Engineer","preferred_location":"Bangalore"})
    mock.append({"student_email":s["student_email"],"technical":random.randint(40,100),"hr":random.randint(40,100),"communication":random.randint(40,100)})
rel("aptitude_scores.csv",apt);rel("attendance.csv",att);rel("semester_results.csv",sem)
rel("student_preferences.csv",pref);rel("mock_interviews.csv",mock)
print("Generated 18 CSV files.")
