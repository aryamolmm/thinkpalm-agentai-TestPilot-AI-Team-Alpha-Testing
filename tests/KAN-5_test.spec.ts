// Import required modules
import { test, expect } from '@playwright/test';
import { PaymentPage } from './payment-page';
import { CheckoutPage } from './checkout-page';
import { HomePage } from './home-page';
import { LoginPage } from './login-page';

// Define test suite
test.describe('Make Payment', () => {
  // Define test data
  const validCardDetails = {
    cardNumber: '4111111111111111',
    expirationDate: '12/2025',
    cvv: '123',
  };

  const invalidCardDetails = {
    cardNumber: '4111111111111112',
    expirationDate: '12/2020',
    cvv: '123',
  };

  // Happy Path
  test('should make payment successfully', async ({ page }) => {
    // Login to the application
    const loginPage = new LoginPage(page);
    await loginPage.login('username', 'password');

    // Navigate to home page
    const homePage = new HomePage(page);
    await homePage.navigateTo();

    // Add item to cart
    await homePage.addItemToCart();

    // Navigate to checkout page
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.navigateTo();

    // Make payment
    const paymentPage = new PaymentPage(page);
    await paymentPage.makePayment(validCardDetails);

    // Verify payment success
    await expect(paymentPage.paymentSuccessMessage).toContainText('Payment successful');
  });

  // Negative cases
  test('should display error message for invalid card details', async ({ page }) => {
    // Login to the application
    const loginPage = new LoginPage(page);
    await loginPage.login('username', 'password');

    // Navigate to home page
    const homePage = new HomePage(page);
    await homePage.navigateTo();

    // Add item to cart
    await homePage.addItemToCart();

    // Navigate to checkout page
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.navigateTo();

    // Make payment with invalid card details
    const paymentPage = new PaymentPage(page);
    await paymentPage.makePayment(invalidCardDetails);

    // Verify error message
    await expect(paymentPage.paymentErrorMessage).toContainText('Invalid card details');
  });

  test('should display error message for expired card', async ({ page }) => {
    // Login to the application
    const loginPage = new LoginPage(page);
    await loginPage.login('username', 'password');

    // Navigate to home page
    const homePage = new HomePage(page);
    await homePage.navigateTo();

    // Add item to cart
    await homePage.addItemToCart();

    // Navigate to checkout page
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.navigateTo();

    // Make payment with expired card
    const paymentPage = new PaymentPage(page);
    const expiredCardDetails = {
      cardNumber: '4111111111111111',
      expirationDate: '12/2020',
      cvv: '123',
    };
    await paymentPage.makePayment(expiredCardDetails);

    // Verify error message
    await expect(paymentPage.paymentErrorMessage).toContainText('Card has expired');
  });

  // Edge cases
  test('should handle empty card details', async ({ page }) => {
    // Login to the application
    const loginPage = new LoginPage(page);
    await loginPage.login('username', 'password');

    // Navigate to home page
    const homePage = new HomePage(page);
    await homePage.navigateTo();

    // Add item to cart
    await homePage.addItemToCart();

    // Navigate to checkout page
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.navigateTo();

    // Make payment with empty card details
    const paymentPage = new PaymentPage(page);
    const emptyCardDetails = {
      cardNumber: '',
      expirationDate: '',
      cvv: '',
    };
    await paymentPage.makePayment(emptyCardDetails);

    // Verify error message
    await expect(paymentPage.paymentErrorMessage).toContainText('Please fill in all fields');
  });

  test('should handle special characters in card details', async ({ page }) => {
    // Login to the application
    const loginPage = new LoginPage(page);
    await loginPage.login('username', 'password');

    // Navigate to home page
    const homePage = new HomePage(page);
    await homePage.navigateTo();

    // Add item to cart
    await homePage.addItemToCart();

    // Navigate to checkout page
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.navigateTo();

    // Make payment with special characters in card details
    const paymentPage = new PaymentPage(page);
    const specialCharCardDetails = {
      cardNumber: '4111111111111111!',
      expirationDate: '12/2025',
      cvv: '123!',
    };
    await paymentPage.makePayment(specialCharCardDetails);

    // Verify error message
    await expect(paymentPage.paymentErrorMessage).toContainText('Invalid card details');
  });
});