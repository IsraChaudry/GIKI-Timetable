from openpyxl import Workbook

wb = Workbook()
ws = wb.active
ws.title = "courses"

headers = ["course_name", "course_code", "credit_hours", "is_lab",
           "dept_name", "batch_section", "teacher_name"]
ws.append(headers)

# Example rows
ws.append(["Data Structures", "CS232",   3, "No",  "Computer Science", "CS LH1", "Dr. Omer Bin Saeed"])
ws.append(["Calculus",        "MATH101", 3, "No",  "Computer Science", "CS LH1", "Said Nabi"])
ws.append(["Programming Lab", "CS232-L", 1, "Yes", "Computer Science", "CS LH1", "Dr. Zoya"])

wb.save("courses_template.xlsx")
print("Template saved: courses_template.xlsx")
