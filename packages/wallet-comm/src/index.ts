import { Channel } from 'fmg-core';

export function sendTestMessage(IFrameId: string, message: string) {
  const iFrame = <HTMLIFrameElement>document.getElementById(IFrameId);
  iFrame.contentWindow.postMessage(message, "*");
}

export async function initializeWallet(iFrameId: string, userId: string): Promise<string> {
  const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
  // TODO: Export to interface
  const message = {
    type: 'INITIALIZE_WALLET',
    userId
  };
  iFrame.contentWindow.postMessage(message, "*");
  return new Promise(resolve => {
    window.addEventListener("message", function eventListener(event: MessageEvent) {
      if (event.data && event.data.type && event.data.type === "WALLET.INITIALIZATION.SUCCESS") {
        window.removeEventListener("message", eventListener);
        console.log('init success');
        resolve(event.data.address);
      }
    });
  });
}


// export async function openChannel(iFrameId: string, channel: Channel) {
//   const iFrame = <HTMLIFrameElement>document.getElementById(iFrameId);
//   iFrame.contentWindow.postMessage("openSesame", "*");
//   return new Promise(resolve => {
//     iFrame.contentWindow.addEventListener("message", (event: Event) => {
//       if (event) {
//         resolve(event);
//       }
//     });
//   });
// }