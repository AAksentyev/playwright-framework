# Decorators

This framework comes with several utility decorators for your methods that provide your tests with additional stability and transparency.

## @Step
The simplest decorator is the Step decorator. This is simply wraps all actions in the decorated method in a `test.step()` to ensure your reports are clean and compartmentalized.

You can define a custom step name by passing it as a string argument to the decorator. If custom step name is not provided, the method name will be used by default as the step name.

Example:
```typescript

class MyPageObjectClass {
    constructor(private readonly page:Page){}

    // Any time this method is called, the report will show 'myMethod' as the step name
    @Step()
    async myMethod(){
        await this.page.getByRole('textbox', {name: 'mytextbox'}).fill('xyz');
        await this.page.getByRole('button', {name: 'mybtn'}).click();
    }

    // These steps will appear with a custom step name
    @Step('Perform Login Steps')
    async doLogin(){
        await this.page.getByRole('textbox', {name: 'Username'}).fill('username');
        await this.page.getByRole('textbox', {name: 'Password'}).fill('password');
        await this.page.getByRole('button', {name: 'Log In'}).click();
    }
}
```

## @Retry
This decorator allows you to re-run only a specific method if it throws without having to spend time re-running the entire the test.
If you have a method with an inconsistent or flaky locator, you can use this decorator to retry the execution with a defined number of attempts.

This can be toggled on and off using `process.env.RETRY_ENABLED` to give you more flexibility with retry tolerance between environments

```typescript

class DisabledInputPage {
    constructor(private readonly page: Page) {}

    /** ..............  */

    /** locator for the textbox on the page */
    private get textboxLocator():Locator {
        return this.page.getByRole('textbox', { name: 'My Disabled Texbox' });
    }

    /**
     * If this method throws, for example due to a textbox not being enabled on time,
     * it will automatically retry the method n number of times - as defined in `attempts`
     * with 1000ms delay between attempts.
     * 
     * optional onRetry callback can be passed for any logging or other visibility actions
     * @param value
     */
    @Retry({
        attempts: 3,
        delay: 1000,
        onRetry(error, attempt) {
            Logger.warn(`fillTextboxWithRetry failed. Attempt ${attempt} of 3`);
        },
    })
    public async fillTextboxWithRetry(value: string): Promise<void> {
        await this.textboxLocator.fill('myValue');
    }
}

```

## @ResponseThreshold
Define a response time threshold in ms for a given API call method. When using the provided APIHelper methods, they will return the duration of the API request and the decorator will log a warning to the test if the time exceeds the defined response threshold. 

Optionally, you can set the test to auto-fail if the defined threshold is exceeded.

In the example below, `apiThatMustMeetResponseThreshold` will fail the test if the response time of the GET request mapped to 'getAllMakes' exceeds 300ms.

```typescript
class API extends APIHelpers {
    @ResponseThreshold({
        maxMs: 300,
        label: 'This api cannot ',
        // optional. By default, the decorator will only log a warning to the test
        // but you can set soft: false to hard fail the test in case the threshold is exceeded 
        soft: false, 
    
    })
    static async apiThatMustMeetResponseThreshold(
        request: APIRequestContext,
        values: ParamValues = [],
        config?: object
    ) {
        return this.doGetData<GetAllMakesResponse>(request, 'getAllMakes', values, config);
    
    }
}
```
