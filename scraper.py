import csv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from undetected_chromedriver import Chrome, ChromeOptions
import time

# Set up ChromeOptions for headless browsing
chrome_options = ChromeOptions()
chrome_options.headless = False

chrome_options.add_argument("--ignore-certificate-errors")
chrome_options.add_argument("--allow-running-insecure-content")

# Initialize the WebDriver with ChromeOptions
driver = Chrome(options=chrome_options)

# List to store scraped data
data = []

# Set to keep track of scraped URLs
scraped_urls = set()

# CSV file to save questions
csv_file = "leetcode_questions.csv"

# Create a CSV header
header = ["Title", "Difficulty", "Accuracy", "Content", "URL"]

def scroll_until_enough_questions(driver, limit):
    questions_container = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (By.CLASS_NAME, "explore_problems_container__Ols1C")
        )
    )

    total_scraped = 0
    while total_scraped < limit:
        print(f"Total scraped: {total_scraped}")
        # Extract question cards
        question_cards = questions_container.find_elements(
            By.CLASS_NAME, "explore_problem__XatX9"
        )
        if not question_cards:
            print("No more questions to scrape.")
            break

        # Scroll down to last card and check if more questions are loaded
        driver.execute_script("arguments[0].scrollIntoView();", question_cards[-1])
        time.sleep(2)
        

        total_scraped = len(question_cards)

    return total_scraped
    

def scrape_gfg_questions(max_questions):
    try:
        # Load the initial page
        url = "https://www.geeksforgeeks.org/explore?page=1&sortBy=submissions"
        driver.get(url)

        total_scraped = 0
        
        # Scroll until enough questions are loaded
        total_scraped_limit = scroll_until_enough_questions(driver, max_questions)
        
        while total_scraped < max_questions:
            # # Wait for the page to load
            questions_container = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located(
                    (By.CLASS_NAME, "explore_problems_container__Ols1C")
                )
            )

            # Extract question cards
            question_cards = questions_container.find_elements(
                By.CLASS_NAME, "explore_problem__XatX9"
            )
            if not question_cards:
                print("No more questions to scrape.")
                break
            
            print(f"Number of questions: {len(question_cards)}")
            for card in question_cards:
                if total_scraped >= max_questions:
                    break

                try:
                    print("Scraping question no. ", total_scraped + 1)
                    # scroll to the card
                    driver.execute_script("arguments[0].scrollIntoView();", card)
                    time.sleep(0.5)
                    
                    # Extract question details
                    card.click()

                    # Switch to the newly opened tab
                    driver.switch_to.window(driver.window_handles[-1])

                    # Wait for the element to be present
                    WebDriverWait(driver, 20).until(
                        EC.presence_of_element_located((By.CLASS_NAME, 'problems_header_content__title__L2cB2'))
                    )

                    # Extract the title
                    title_div = driver.find_element(By.CLASS_NAME, 'problems_header_content__title__L2cB2')
                    title_h3 = title_div.find_element(By.TAG_NAME, "h3")
                    title = title_h3.text
                    # print("Title:", title)

                    # Extract difficulty and accuracy
                    header_element = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CLASS_NAME, 'problems_header_description__t_8PB'))
                    )
                    header_text = header_element.text if header_element else "N/A"
                    
                    difficulty = "N/A"
                    accuracy = "N/A"
                    if "Difficulty: " in header_text:
                        difficulty = header_text.split("Difficulty: ")[1].split(" ")[0]
                    if "Accuracy: " in header_text:
                        accuracy = header_text.split("Accuracy: ")[1].split(" ")[0]

                    # Extract content/description
                    content_div = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CLASS_NAME, 'problems_problem_content__Xm_eO'))
                    )
                    content_spans = content_div.find_elements(By.TAG_NAME, "span")
                    content = [span.text for span in content_spans if span.find_elements(By.TAG_NAME, "strong")]

                    # Join the content into a single string
                    content_text = " ".join(content)
                    # print("Content:", content_text)

                    question_url = driver.current_url

                    # Check if the URL has already been scraped
                    if question_url in scraped_urls:
                        driver.close()
                        driver.switch_to.window(driver.window_handles[0])
                        continue

                    # Add the URL to the set of scraped URLs
                    scraped_urls.add(question_url)

                    # Print or save the extracted details
                    data.append([title, difficulty, accuracy, content_text, question_url])
                    # print(f"Title: {title}, URL: {question_url}, Difficulty: {difficulty}, Accuracy: {accuracy}")

                    # Close the current tab and switch back to the original tab
                    driver.close()
                    driver.switch_to.window(driver.window_handles[0])

                    total_scraped += 1

                except Exception as e:
                    print(f"Error scraping question: {e}")

            # Scroll down to load more questions
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)  # Wait for new questions to load

    except Exception as e:
        print(f"Error scraping page: {e}")
    finally:
        driver.quit()

# Step 3: Save data to CSV
def save_to_csv():
    with open(csv_file, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(header)  # Write the header
        writer.writerows(data)  # Write the rows
    print(f"Data saved to {csv_file}")

# Main script
scrape_gfg_questions(150)  # Scrape up to 50 questions
save_to_csv()