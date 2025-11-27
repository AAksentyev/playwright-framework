import { faker } from '@faker-js/faker';

export class FakerHelper {
    /** Random UUID */
    static uuid(): string {
        return faker.string.uuid();
    }

    /** Random first name */
    static firstName(): string {
        return faker.person.firstName();
    }

    /** Random last name */
    static lastName(): string {
        return faker.person.lastName();
    }

    /** Full name */
    static fullName(): string {
        return faker.person.fullName();
    }

    /** Random email with optional domain override */
    static email(domain: string = 'example.com'): string {
        const user = faker.internet.username().replace(/[^\w]/g, '').toLowerCase();
        return `${user}@${domain}`;
    }

    /** Random password */
    static password(length: number = 12): string {
        return faker.internet.password({ length });
    }

    /** Phone number */
    static phone(): string {
        return faker.phone.number();
    }

    /** Street address */
    static address(): string {
        return faker.location.streetAddress();
    }

    /** Integer between min–max */
    static int(min: number = 1, max: number = 9999): number {
        return faker.number.int({ min, max });
    }

    /** Word */
    static word(): string {
        return faker.word.sample();
    }

    /** Sentence */
    static sentence(words: number = 8): string {
        return faker.lorem.sentence(words);
    }

    /**
     * Creates a string of EXACT length `len`.
     * Includes alphanumeric + spaces by default.
     * Can optionally include punctuation.
     */
    static stringOfLength(len: number, opts: { includePunctuation?: boolean } = {}): string {
        const alphaNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
        const punctuation = '.,!?-_:;()[]{}';

        const charset = opts.includePunctuation ? alphaNum + punctuation : alphaNum;

        let result = '';
        for (let i = 0; i < len; i++) {
            const index = faker.number.int({ min: 0, max: charset.length - 1 });
            result += charset[index];
        }
        return result;
    }
}
