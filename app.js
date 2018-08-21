'use strict';

const applicationServerPublicKey = 'BD2iZ3fdD1IdYyJCHAJmwLsJPrPxeetpYe_zit7UGt4x5Nkas5TCYkLIVTabOWikVLaTDDPXkXdG0Ho1xZh6Ozw';

const pushCheckbox = document.querySelector('.js-push-toggle-checkbox');

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**** START register-sw ****/
function registerServiceWorker() {
  return navigator.serviceWorker.register('service-worker.js')
  .then(function(registration) {
    console.log('Service worker successfully registered.');
    return registration;
  })
  .catch(function(err) {
    console.error('Unable to register service worker.', err);
  });
}
/**** END register-sw ****/

// This is just to make sample code eaier to read.
// TODO: Move into a variable rather than register each time.
function getSWRegistration() {
  return navigator.serviceWorker.register('service-worker.js');
}

const worker = new Worker('worker.js');
worker.addEventListener('message', event => {
  console.log(event.data, 'Message from the worker!');
});

/**** START request-permission ****/
function askPermission() {
  return new Promise(function(resolve, reject) {
    const permissionResult = Notification.requestPermission(function(result) {
      resolve(result);
    });

    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  })
  .then(function(permissionResult) {
    if (permissionResult !== 'granted') {
      throw new Error('We weren\'t granted permission.');
    }
  });
}
/**** END request-permission ****/

/**
 * Using `Notification.permission` directly can be slow (locks on the main
 * thread). Using the permission API with a fallback to
 * `Notification.permission` is preferable.
 * @return {Promise<String>} Returns a promise that resolves to a notification
 * permission state string.
 */
/**** START get-permission-state ****/
function getNotificationPermissionState() {
  if (navigator.permissions) {
    return navigator.permissions.query({name: 'notifications'})
    .then((result) => {
      return result.state;
    });
  }

  return new Promise((resolve) => {
    resolve(Notification.permission);
  });
}
/**** END get-permission-state ****/

function unsubscribeUserFromPush() {
  return registerServiceWorker()
    .then(function(registration) {
      // Service worker is active so now we can subscribe the user.
      return registration.pushManager.getSubscription();
    })
    .then(function(subscription) {
      if (subscription) {
        return subscription.unsubscribe();
      }
    })
    .then(function(subscription) {
      pushCheckbox.disabled = false;
      pushCheckbox.checked = false;
    })
    .catch(function(err) {
      console.error('Failed to subscribe the user.', err);
      getNotificationPermissionState()
      .then((permissionState) => {
        pushCheckbox.disabled = permissionState === 'denied';
        pushCheckbox.checked = false;
      });
    });
}

function updateSubscriptionOnServer(subscription) {
  // TODO: Send subscription to application server

  const subscriptionJson = document.querySelector('.js-subscription-json');
  const subscriptionDetails =
    document.querySelector('.js-subscription-details');

  if (subscription) {
    subscriptionJson.textContent = JSON.stringify(subscription);
    subscriptionDetails.classList.remove('is-invisible');
  } else {
    subscriptionDetails.classList.add('is-visible');
  }
}

function subscribeUserToPush() {
  return getSWRegistration()
  .then(function(registration) {
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'BD2iZ3fdD1IdYyJCHAJmwLsJPrPxeetpYe_zit7UGt4x5Nkas5TCYkLIVTabOWikVLaTDDPXkXdG0Ho1xZh6Ozw'
      )
    };

    return registration.pushManager.subscribe(subscribeOptions);
  })
  .then(function(pushSubscription) {
    console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
    return pushSubscription;
  });
}
/**** END subscribe-user ****/

function setUpPush() {
  return Promise.all([
    registerServiceWorker(),
    getNotificationPermissionState()
  ])
  .then(function(results) {
    const registration = results[0];
    const currentPermissionState = results[1];

    if (currentPermissionState === 'denied') {
      console.warn('The notification permission has been blocked. Nothing we can do.');
      pushCheckbox.disabled = true;
      return;
    }

    pushCheckbox.addEventListener('change', function(event) {
      // Disable UI until we've handled what to do.
      event.target.disabled = true;

      if (event.target.checked) {
        // Just been checked meaning we need to subscribe the user
        // Do we need to wait for permission?
        let promiseChain = Promise.resolve();
        if (currentPermissionState !== 'granted') {
          promiseChain = askPermission();
        }

        promiseChain
          .then(subscribeUserToPush)
          .then(function(subscription) {
            if (subscription) {
              return sendSubscriptionToServer(subscription)
              .then(function() {
                return subscription;
              });
            }

            return subscription;
          })
          .then(function(subscription) {
            // We got a subscription AND it was sent to our backend,
            // re-enable our UI and set up state.
            pushCheckbox.disabled = false;
            pushCheckbox.checked = subscription !== null;
          })
          .catch(function(err) {
            console.error('Failed to subscribe the user.', err);

            // An error occured while requestion permission, getting a
            // subscription or sending it to our backend. Re-set state.
            pushCheckbox.disabled = currentPermissionState === 'denied';
            pushCheckbox.checked = false;
          });
      } else {
        // Just been unchecked meaning we need to unsubscribe the user
        unsubscribeUserFromPush();
      }
    });

    if (currentPermissionState !== 'granted') {
      // If permission isn't granted than we can't be subscribed for Push.
      pushCheckbox.disabled = false;
      return;
    }

    return registration.pushManager.getSubscription()
    .then(function(subscription) {
      pushCheckbox.checked = subscription !== null;
      pushCheckbox.disabled = false;
    });
  })
  .catch(function(err) {
    console.log('Unable to register the service worker: ' + err);
  });
}

window.onload = function() {
  /**** START feature-detect ****/
  if (!('serviceWorker' in navigator)) {
    // Service Worker isn't supported on this browser, disable or hide UI.
    return;
  }

  if (!('PushManager' in window)) {
    // Push isn't supported on this browser, disable or hide UI.
    return;
  }
  /**** END feature-detect ****/

  // Push is supported.
  setUpPush();
};

/*
 * Get various elements used during the demo from the DOM
 */
const hash          = document.location.hash;
const currentUrlEl  = document.getElementById('current-url');
const clientIdForm  = document.getElementById('client-id-form');
const clientIdInput = document.getElementById('client-id');
const authLink      = document.getElementById('auth-url');

/*
 * The state variable is used to guard against CSRF attacks as described in:
 * https://tools.ietf.org/html/rfc6749#section-10.12
 */
let state = null;

/*
 * Handler for the client ID input field.
 *
 * Just used for this demo to get the Client ID for the newly registered app.
 * Normally your Client ID would be stored in a configuration file.
 */
function submitClientId(e) {
  e.preventDefault();

  var clientId = clientIdInput.value;
  if (clientId) {
    // We're stripping the trailing slash just in case you added
    // the site URL without trailing slash when creating the App
    var redirectURI = document.location.href;
    authLink.href = 'https://app.netlify.com/authorize?' +
        'client_id=' + clientId +
        '&response_type=token' +
        '&redirect_uri=' + redirectURI +
        '&state=' + state;
    setCurrentStep(2);
  }
}

/*
 * This function is called when a user returns from Netlify and has accepted the
 * request to authorize your app.
 *
 * It extracts the token from the response and use it to do a simple API request
 * fetching the latest sites from the user from Netlify.
 */
function handleAccessToken() {
  // The access token is returned in the hash part of the document.location
  //   #access_token=1234&response_type=token
  const response = hash.replace(/^#/, '').split('&').reduce((result, pair) => {
    const keyValue = pair.split('=');
    result[keyValue[0]] = keyValue[1];
    return result;
  }, {});

  // Remove the token so it's not visible in the URL after we're done
  document.location.hash = '';

  if (!localStorage.getItem(response.state)) {
    // We need to verify the random state we set before starting the request,
    // otherwise this could be an access token from someone else than our user
    alert("CSRF Attack");
    return;
  }

  localStorage.removeItem(response.state);

  // User the token to fetch the list of sites for the user
  fetch('https://api.netlify.com/api/v1/sites', {
    headers: {
      'Authorization': 'Bearer ' + response.access_token
    }
  }).then((response) => {
    response.json().then((json) => {
      showOutput('Your sites: ' + json.map((site) => `<a href="${site.url}">${site.url}</a>`).join(','));
    });
  }).catch((error) => {
    showOutput(`Error fetching sites: ${error}`);
  });
}


/*
 * Small helper method to change the current step and show the right element
 */
function setCurrentStep(step) {
  Array.from(document.querySelectorAll('.visible')).forEach((el) => el.classList.remove('visible'));
  document.getElementById('step-' + step).classList.add('visible');
}


/*
 * Small helper method to show some output in the last step of the flow
 */
function showOutput(text) {
  document.getElementById('output').innerHTML = text;
}


/*
 * The Oauth2 implicit grant flow works by sending the user to Netlify where she'll
 * be asked to grant authorization to your application. Netlify will then redirect
 * back to the Redirect URI on file for your app and set an access_token paramter
 * in the "hash" part of the URL.
 *
 * If we have any hash, it's because the user is coming back from Netlify and we
 * can start doing API requests on their behalf.
 *
 * If not, we'll trigger the first step and prepare to send the user to Netlify.
 */
if (hash) {
  setCurrentStep(3);
  handleAccessToken();
} else {
  currentUrlEl.textContent = document.location.href;
  clientIdForm.addEventListener('submit', submitClientId, false);
  setCurrentStep(1);

  // We generate a random state that we'll validate when Netlify redirects back to
  // our app.
  state = Math.random();
  localStorage.setItem(state, true);
}