import puppeteer from "puppeteer";
import dotenv from "dotenv"; // To use environment variables

dotenv.config(); // To use environment variables

(async () => {
  try {
    // Launch the browser
    const browser = await puppeteer.launch({
      headless: false, // Set to true to run headless
      args: [
        "--use-fake-ui-for-media-stream", // Auto-allow camera/mic
        "--disable-infobars",
        "--start-maximized",
      ],
    });

    // Open a new page
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to Google Meet URL
    await page.goto("https://meet.google.com/your-meeting-id", {
      waitUntil: "networkidle2",
    });

    // Check if the user needs to log in
    if (await page.$('input[type="email"]')) {
      console.log("Logging in...");

      // Enter the email
      await page.type('input[type="email"]', process.env.GOOGLE_EMAIL);
      await page.click("#identifierNext");

      // Wait for the password field and enter the password
      await page.waitForSelector('input[type="password"]', { visible: true });
      await page.type('input[type="password"]', process.env.GOOGLE_PASSWORD);
      await page.click("#passwordNext");

      // Wait for successful login (handle potential 2FA here if needed)
      await page.waitForNavigation({ waitUntil: "networkidle2" });
    } else {
      console.log("Already logged in");
    }

    // Wait for the "Join now" button to appear and click it
    await page.waitForSelector('[jsname="Qx7uuf"]', { visible: true });
    await page.click('[jsname="Qx7uuf"]');

    console.log("Successfully joined the Google Meet.");

    // Optional: Capture screenshot after joining
    await page.screenshot({ path: "meet-screenshot.png" });

    // Wait for 10 minutes before closing (or adjust based on your requirement)
    console.log("Waiting in the meeting...");
    await new Promise((resolve) => setTimeout(resolve, 600000)); // 10 minutes

    // Close the browser
    await browser.close();
    console.log("Browser closed successfully.");
  } catch (error) {
    console.error("Error:", error);
  }
})();
