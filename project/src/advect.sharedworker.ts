import { type ActionKey, Actions } from './advect.actions';

// set of all connected ports
// @ts-ignore
onconnect = (connectEvent) => {
    /**
     * @type {MessagePort}
     */
    const port = connectEvent.ports[0]; // gimme dat port

    // listen for messages for the action handler
    port.addEventListener("message",(event:MessageEvent) => {
        try{
            const { data } = event; // gimme dat data

            // make sure we have an action and it's a function
            if (data && data?.action && Actions[data.action as ActionKey]){
                try{
                    (Actions[data.action as ActionKey])(data.data).then( result => {
                        port.postMessage({action: data.action, result, $id: data.$id});
                    })     
    
                }catch(error){
                    console.log(error)
                    port.postMessage({action: data.action, result:error, $id: data.$id, isError: true});
                }
            }else{
                console.warn('Unknown action', data);
            }
        }catch(e){
            
        }
       
    });
    port.start(); // Required when using addEventListener. Otherwise called implicitly by onmessage 
}


