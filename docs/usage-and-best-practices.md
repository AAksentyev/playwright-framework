# Usage and Best Practices

Below are the standards and practices that should be used to get the most out of this framework. Some of it may seem straightforward, but this ReadMe standarizes the usage and practices of this framework.

## Basics
The following are some basic standards that should be adhered to.: 
1. **POM/COM classes should have unambiguous descriptions** to ensure clear usage intent, especially when it comes to Component Object Models. If the component is specific to the page rather than a global application-wide component (for example, a sticky navigation menu), it should be noted.
2. **Non-trivial methods and functions should be documented** as much as possible.
3. **Strong typing should be used as much as possible** to enable increased integrity and reduce compile-time bugs. This applies to variable definitions and parameters as much as to function/method return values. 'any' can always be used to get the code to working state, but it should almost always be refractored to type the variables and responses. (If for no reason other than you'll get autocomplete for the objects)

## Classes

The framework provides prebuilt base classes (which can be added to as needed) to ensure standardization of locator interactions, class definition, and reporting enhancements, such as the Interaction Heatmap report and any visual regression testing. 

### Page Object Models
1. Every Page Object should extend the `BasePage` class. 
2. If applicable, the defined url getter should be non-null.
3. *Ideally*, the root locator should be defined as it may reduce potential locator duplication and would ensure tailored page screenshots without sticky non-page-specific components. However, some page architecture may not necessarily make this difficult or not feasible.

### Component Object Models
1. Every Component Object class should extend the `BaseComponent` class.
2. Root component should always be defined for Component Object classes.

### Decorators
If a POM method contains multiple actions that are performed, a `@Step` decorator should be added to it to compartmentalize those actions in the report. Example:

```typescript
@Step('Perform login actions')
public async logIn(username: string, password: string, timeout: number = 10000): Promise<void> {
    Logger.debug(`Performing login actions on the Login page for username '${username}'`);
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogIn();

    await expect(
        this.page.getByText(`Welcome, ${username}!`),
        'Welcome message should be visible'
    ).toBeVisible({ timeout });
}
```

### Tests and Fixtures
1. **POM/COM classes should almost never be instantiated inside the tests.** Fixtures should be used to ensure reduced boilerplate code in the test files.
2. **Any seemingly simple, reusable POM/COM fixtures can be defined in a separate base fixture**, that other, more complex class fixtures, can extend and get access to the reusable component if needed inside those tests. This helps achieve point #1.

## Tags
All tests or describe blocks should be tagged using the provided `TAGS` constant.


