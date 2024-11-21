import csv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import time
chromedriver_path = "./chromedriver.exe"

chrome_options = webdriver.ChromeOptions()
chrome_options.headless = True  # Enable headless mode for background execution
chrome_options.add_argument("--ignore-certificate-errors")
chrome_options.add_argument("--allow-running-insecure-content")

# Initialize the WebDriver with ChromeOptions
driver = webdriver.Chrome(options=chrome_options)

# Login URL and credentials
gfg_base_url = "https://www.geeksforgeeks.org/explore?page=1&sortBy=submissions"

# List to store scraped data
data = []

# CSV file to save questions
csv_file = "leetcode_questions.csv"

# Create a CSV header
header = ["Title", "Acceptance Rate", "Submission Rate", "Difficulty", "Details"]

def scrape_gfg_questions():
    current_page = 1
    try:
        while True:
            # Load the current page
            url = f"https://www.geeksforgeeks.org/explore?page={current_page}&sortBy=submissions"
            driver.get(url)

            # Wait for the page to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "explore_problems_container__Ols1C"))
            )

            # Extract question cards
            question_cards = driver.find_elements(By.CLASS_NAME, "explore_problem__XatX9")
            if not question_cards:
                print("No more questions to scrape.")
                break

            for card in question_cards:
                try:
                    # Extract question details
                    # title_element = card.find_element(By.CLASS_NAME, "explore_problem_name__3QSiP")

                    # Safely extract the <a> tag
                    card.click()

                    driver.switch_to.window(driver.window_handles[-1])

                    # Wait for the question page to load
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CLASS_NAME, "problems_header_content__title__L2cB2"))
                    )

                    title_element = card.find_element(By.CLASS_NAME, "problems_header_content__title__L2cB2")
                    title = title_element.text if title_element else "N/A"
                
                    # Extract content from spans
                    content_div = card.find_element(By.CLASS_NAME, "problems_header_description__t_8PB")
                    content_spans = content_div.find_elements(By.TAG_NAME, "span")
                    content = [span.text for span in content_spans if span.find_element(By.TAG_NAME, "strong")]

                    # Join the content into a single string
                    content_text = " ".join(content)
                    print(content_text)
                    # Wait for the question page to load
                    # WebDriverWait(driver, 10).until(
                    #     EC.presence_of_element_located((By.CLASS_NAME, "entry-content"))
                    # )

                    # Now, extract the current URL (which is the question's page URL)f
                    question_url = driver.current_url
                    # Extract difficulty
                    difficulty_element = card.find_element(By.CLASS_NAME, "explore_problemTagsContainer__qK7n9")
                    difficulty = difficulty_element.text if difficulty_element else "N/A"

                    # Extract accuracy
                    accuracy_element = card.find_element(By.CLASS_NAME, "explore_problemAccuracy__4hPJz")
                    accuracy = accuracy_element.text if accuracy_element else "N/A"

                    # Optionally navigate to the question page for more details
                    if question_url != "N/A":
                        driver.get(question_url)
                        WebDriverWait(driver, 10).until(
                            EC.presence_of_element_located((By.CLASS_NAME, "entry-content"))
                        )
                        # Extract additional details if needed.

                    # Print or save the extracted details
                    data.append([title, accuracy, difficulty, "N/A", question_url])  # Add details to data list
                    print(f"Title: {title}, URL: {question_url}, Difficulty: {difficulty}, Accuracy: {accuracy}")

                except Exception as e:
                    print(f"Error scraping question: {e}")

            current_page += 1  # Go to the next page

    except Exception as e:
        print(f"Error scraping page: {e}")
    finally:
        driver.quit()

# Call the scrape function
scrape_gfg_questions()
# Step 3: Save data to CSV
def save_to_csv():
    with open(csv_file, "w", newline="") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(header)  # Write the header
        writer.writerows(data)  # Write the rows
    print(f"Data saved to {csv_file}")

# Main script
scrape_gfg_questions()
save_to_csv()

# Close the WebDriver
driver.quit()

