import { TAG } from '@constants/tags.ts';
import { test } from '@fixtures/class-attribute-page.fixture.ts';
import { expectAlert, expectNoAlert } from '@helpers/alerts/alertHelpers.ts';

/**
 * Class Attribute page tests
 */
test.describe('Class Attribute page link tests', { tag: [TAG.UI] }, async () => {

    // Button with success class should not trigger an alert
    test('Button with success class does not trigger', async({page, classAttributePage})=>{
        await test.step('Click button and assert alert does not appear', async({})=>{
            await expectNoAlert( page, 
                                async () => { await classAttributePage.clickSuccessButton()}
            )
        });
    })
    
    // Button with warning class should not trigger an alert
    test('Button with warning class does not trigger', async({page, classAttributePage})=>{
        await test.step('Click button and assert alert does not appear', async({})=>{
            await expectNoAlert( page, 
                                async () => { await classAttributePage.clickWarningButton()}
            )
        });
    })

    // Button with primary class SHOULD trigger an alert
    test('Button with primary class triggers alert', async({page, classAttributePage})=>{
        await test.step('Click button and assert alert appears with expected message', async({})=>{
            await expectAlert( page, 
                            async () => { await classAttributePage.clickPrimaryButton()},
                            {   messageContains: 'Primary button pressed',
                                accept: true
                            }
            )
        });
    })
});