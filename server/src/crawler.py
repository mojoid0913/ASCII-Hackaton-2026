# src/crawler.py
import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def inspect_url(target_url: str):
    """
    Selenium 컨테이너(Remote)를 통해 URL에 접속하고 정보를 가져옵니다.
    """
    print(f"🕵️‍♂️ 크롤러 시작: {target_url} 검사 중...")

    # 1. 옵션 설정
    chrome_options = Options()
    # 화면을 보고 싶다면 headless는 끕니다. (속도를 원하면 주석 해제)
    # chrome_options.add_argument('--headless') 
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    # 창 크기 설정 (스크린샷 예쁘게 찍기 위해)
    chrome_options.add_argument("--window-size=1920,1080")

    # 2. Remote WebDriver 연결 주소 (Docker Compose 서비스명 'selenium' 사용)
    selenium_hub_url = os.getenv("SELENIUM_URL", "http://selenium:4444/wd/hub")

    driver = None
    result = {
        "status": "fail",
        "title": "",
        "final_url": "",
        "error": ""
    }

    try:
        # 원격 브라우저 연결
        driver = webdriver.Remote(
            command_executor=selenium_hub_url,
            options=chrome_options
        )

        # 3. URL 접속
        driver.get(target_url)
        
        # 페이지 로딩 대기 (3초)
        time.sleep(3)

        # 4. 정보 수집
        result["status"] = "success"
        result["title"] = driver.title
        result["final_url"] = driver.current_url
        
        # (선택) 스크린샷 저장 - 나중에 사용자에게 보여줄 이미지
        # driver.save_screenshot(f"/app/data/{target_url.split('//')[-1]}.png")
        
        print(f"✅ 크롤링 성공: {result['title']}")

    except Exception as e:
        print(f"❌ 크롤링 에러: {e}")
        result["error"] = str(e)

    finally:
        # 브라우저 종료 (필수)
        if driver:
            driver.quit()

    return result
