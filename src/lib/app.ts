import { Errors } from 'cs544-js-utils';
import { PagedValues, makeSensorsWs, SensorsWs } from './sensors-ws.js';

import init from './init.js';
import { makeElement, getFormData } from './utils.js';

export default function makeApp(wsUrl: string) {
  const ws = makeSensorsWs(wsUrl);
  init();
  selectTab('addSensorType');
  setupFormSubmitListeners(ws);
  //TODO: add call to select initial tab and calls to set up
  //form submit listeners
}



//TODO: functions to select a tab and set up form submit listeners
function selectTab(rootId: string) {
  // Select the specified tab
  document.querySelector(`#${rootId}-tab`)?.setAttribute('checked', 'true');
}

/** clear out all errors within tab specified by rootId */
function clearErrors(rootId: string) {
  document.querySelectorAll(`.${rootId}-errors`).forEach(el => {
    el.innerHTML = '';
  });
}

// Function to set up form submit listeners
function setupFormSubmitListeners(ws: SensorsWs) {

  // Add Sensor Type Form Submit Listener
  document.querySelector('#addSensorType-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors('addSensorType');
    const formData = getFormData(event.target as HTMLFormElement);
    const result = await ws.addSensorType(formData);
    if (result.isOk) {
      displayResults('addSensorType', result.val);
    } else {
      displayErrors('addSensorType', result.errors);
    }
  });

  // Add Sensor Form Submit Listener
  document.querySelector('#addSensor-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors('addSensor');
    const formData = getFormData(event.target as HTMLFormElement);
    const result = await ws.addSensor(formData);
    if (result.isOk) {
      displayResults('addSensor', result.val);
    } else {
      displayErrors('addSensor', result.errors);
    }
  });

  // Find Sensor Types Form Submit Listener
  document.querySelector('#findSensorTypes-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors('findSensorTypes');
    const formData = getFormData(event.target as HTMLFormElement);
    const result = await ws.findSensorTypesByReq(formData);
    if (result.isOk) {
      displayResultsFind('findSensorTypes', result.val, ws);
    } else {
      displayErrors('findSensorTypes', result.errors);
    }
  });

  // Find Sensors Form Submit Listener
  document.querySelector('#findSensors-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors('findSensors');
    const formData = getFormData(event.target as HTMLFormElement);
    const result = await ws.findSensorsByReq(formData);
    if (result.isOk) {
      displayResultsFind('findSensors', result.val, ws);
    } else {
      displayErrors('findSensors', result.errors);
    }
  });
}

// Helper function to display results
function displayResults(rootId: string, results: Record<string, string>) {
  const resultsContainer = document.querySelector(`#${rootId}-results`);
  resultsContainer!.innerHTML = ''; // Clear previous results
  const dl = makeElement('dl', { class: 'result' });

  // Assuming results is an object, adjust accordingly
  for (const key in results) {
    const dt = makeElement('dt', {}, key);
    const dd = makeElement('dd', {}, results[key]);
    dl.append(dt, dd);
  }
  resultsContainer!.append(dl);
}

function displayResultsFind(rootId: string, results: PagedValues, ws: SensorsWs) {
  const resultsContainer = document.querySelector(`#${rootId}-results`);
  const resultsContent = document.querySelector(`#${rootId}-content`);
  const scrollNext = resultsContent!.querySelectorAll(`a[rel ="next"]`)
  const scrollPrev = resultsContent!.querySelectorAll(`a[rel ="prev"]`)
  resultsContainer!.innerHTML = ''; // Clear previous results
  Array.from(scrollNext).forEach((element: HTMLElement) => {
    if (results.next) {
      //clone and add event listeners
      const clone = element.cloneNode(true) as HTMLElement;
      setVisibility(clone, true);
      clone.addEventListener('click', async (event) => {
        event.preventDefault();
        clearErrors(rootId);
        let result: Errors.Result<PagedValues>;
        if (rootId === 'findSensorTypes')
          result = await ws.findSensorTypesByRelLink(results.next!)
        else
          result = await ws.findSensorsByRelLink(results.next!)
        if (result.isOk) {
          displayResultsFind(rootId, result.val, ws);
        } else {
          displayErrors(rootId, result.errors);
        }
      });
      element.replaceWith(clone)

    } else {
      setVisibility(element, false);
    }
  });

  Array.from(scrollPrev).forEach((element: HTMLElement) => {
    if (results.prev) {
      //clone and add event listeners
      const clone = element.cloneNode(true) as HTMLElement;
      setVisibility(clone, true);
      clone.addEventListener('click', async (event) => {
        event.preventDefault();
        clearErrors(rootId);
        let result: Errors.Result<PagedValues>;
        if (rootId === 'findSensorTypes')
          result = await ws.findSensorTypesByRelLink(results.next!)
        else
          result = await ws.findSensorsByRelLink(results.next!)
        if (result.isOk) {
          displayResultsFind(rootId, result.val, ws);
        } else {
          displayErrors(rootId, result.errors);
        }
      });
      element.replaceWith(clone)

    } else {
      setVisibility(element, false);
    }
  });
  results.values.map(record => {
    const dl = makeElement('dl', { class: 'result' });
    for (const key in record) {
      const dt = makeElement('dt', {}, key);
      const dd = makeElement('dd', {}, record[key]);
      dl.append(dt, dd);

    }
    resultsContainer!.append(dl);
  })


}

/** Display errors for rootId.  If an error has a widget widgetId such
 *  that an element having ID `${rootId}-${widgetId}-error` exists,
 *  then the error message is added to that element; otherwise the
 *  error message is added to the element having to the element having
 *  ID `${rootId}-errors` wrapped within an `<li>`.
 */
function displayErrors(rootId: string, errors: Errors.Err[]) {
  for (const err of errors) {
    const id = err.options.widget;
    const widget = id && document.querySelector(`#${rootId}-${id}-error`);
    if (widget) {
      widget.append(err.message);
    }
    else {
      const li = makeElement('li', { class: 'error' }, err.message);
      document.querySelector(`#${rootId}-errors`)!.append(li);
    }
  }
}

/** Turn visibility of element on/off based on isVisible.  This
 *  is done by adding class "show" or "hide".  It presupposes
 *  that "show" and "hide" are set up with appropriate CSS styles.
 */
function setVisibility(element: HTMLElement, isVisible: boolean) {
  element.classList.add(isVisible ? 'show' : 'hide');
  element.classList.remove(isVisible ? 'hide' : 'show');
}


