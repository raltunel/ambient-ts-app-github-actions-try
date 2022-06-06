import { fetchTokenLists } from './fetchTokenLists';
import { defaultTokenLists } from '../../utils/data/defaultTokenLists';
import { ambientTokenList } from '../../tempdata';

export default function initializeLocalStorage() {
    // boolean to control whether local storage for user data needs updating
    let userUpdated = false;

    // TODO:  @Emily eventually I would like to move the logic for token list
    // TODO:  ... middleware and writing to local storage out of the function
    // TODO:  ... call and into this file, but that's complicated because the
    // TODO:  ... function uses a promise, for now it's easier to leave it
    // TODO:  ... as it currently is written

    // fetch token lists from URIs if none are in local storage
    if (!localStorage.allTokenLists) fetchTokenLists();

    // create the `user` object and send to local storage
    if (!localStorage.user) localStorage.setItem('user', JSON.stringify({}));

    // retrieve the user object from local storage
    // putting it there then pulling it back is necessary to prevent overwrites
    const user = JSON.parse(localStorage.getItem('user') as string);

    // if user object does not have active token lists, initialize with ambient
    if (!user.activeTokenLists || !user.activeTokenLists.length) {
        const tokenLists = JSON.parse(localStorage.allTokenLists).filter(
            (list: any) => list.default === true,
        );
        console.log(tokenLists);
        user.activeTokenLists = defaultTokenLists;
        userUpdated = true;
    }

    // if local storage does not have developmental token list, initialize with
    // ... tokens from the ambient list hardcoded locally
    if (!localStorage.testTokens) {
        localStorage.setItem('testTokens', JSON.stringify(ambientTokenList.tokens));
    }

    if (userUpdated) {
        localStorage.setItem('user', JSON.stringify(user));
    }
}
