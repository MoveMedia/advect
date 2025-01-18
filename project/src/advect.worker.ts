import { type ActionKey, Actions } from './advect.actions';


onmessage = (event) => {
    const { data } = event; // gimme dat data
    // make sure we have an action and it's a function
    if (data && data.action && Actions[data.action as ActionKey]) {
        try {
            // @ts-ignore
             Actions[data.action as ActionKey].call(null, data.data).then (result => {
                postMessage({ action: data.action, result, $id: data.$id });

            })

        } catch (e) {
            postMessage({ action: data.action, result: e, $id: data.$id, isError: true });
        }
    } else {
        console.warn('Unknown action', data);
    }
};