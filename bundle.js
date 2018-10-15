var myBundle = (function (exports,$$observable) {
  'use strict';

  $$observable = $$observable && $$observable.hasOwnProperty('default') ? $$observable['default'] : $$observable;

  /**
   * These are private action types reserved by Redux.
   * For any unknown actions, you must return the current state.
   * If the current state is undefined, you must return the initial state.
   * Do not reference these action types directly in your code.
   */

  const randomString = () =>
    Math.random()
      .toString(36)
      .substring(7)
      .split('')
      .join('.');

  const ActionTypes = {
    INIT: `@@redux/INIT${randomString()}`,
    REPLACE: `@@redux/REPLACE${randomString()}`,
    PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
  };

  /**
   * @param {any} obj The object to inspect.
   * @returns {boolean} True if the argument appears to be a plain object.
   */
  function isPlainObject(obj) {
    if (typeof obj !== 'object' || obj === null) return false

    let proto = obj;
    while (Object.getPrototypeOf(proto) !== null) {
      proto = Object.getPrototypeOf(proto);
    }

    return Object.getPrototypeOf(obj) === proto
  }

  /**
   * Creates a Redux store that holds the state tree.
   * The only way to change the data in the store is to call `dispatch()` on it.
   *
   * There should only be a single store in your app. To specify how different
   * parts of the state tree respond to actions, you may combine several reducers
   * into a single reducer function by using `combineReducers`.
   *
   * @param {Function} reducer A function that returns the next state tree, given
   * the current state tree and the action to handle.
   *
   * @param {any} [preloadedState] The initial state. You may optionally specify it
   * to hydrate the state from the server in universal apps, or to restore a
   * previously serialized user session.
   * If you use `combineReducers` to produce the root reducer function, this must be
   * an object with the same shape as `combineReducers` keys.
   *
   * @param {Function} [enhancer] The store enhancer. You may optionally specify it
   * to enhance the store with third-party capabilities such as middleware,
   * time travel, persistence, etc. The only store enhancer that ships with Redux
   * is `applyMiddleware()`.
   *
   * @returns {Store} A Redux store that lets you read the state, dispatch actions
   * and subscribe to changes.
   */
  function createStore(reducer, preloadedState, enhancer) {
    if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
      enhancer = preloadedState;
      preloadedState = undefined;
    }

    if (typeof enhancer !== 'undefined') {
      if (typeof enhancer !== 'function') {
        throw new Error('Expected the enhancer to be a function.')
      }

      return enhancer(createStore)(reducer, preloadedState)
    }

    if (typeof reducer !== 'function') {
      throw new Error('Expected the reducer to be a function.')
    }

    let currentReducer = reducer;
    let currentState = preloadedState;
    let currentListeners = [];
    let nextListeners = currentListeners;
    let isDispatching = false;

    function ensureCanMutateNextListeners() {
      if (nextListeners === currentListeners) {
        nextListeners = currentListeners.slice();
      }
    }

    /**
     * Reads the state tree managed by the store.
     *
     * @returns {any} The current state tree of your application.
     */
    function getState() {
      if (isDispatching) {
        throw new Error(
          'You may not call store.getState() while the reducer is executing. ' +
            'The reducer has already received the state as an argument. ' +
            'Pass it down from the top reducer instead of reading it from the store.'
        )
      }

      return currentState
    }

    /**
     * Adds a change listener. It will be called any time an action is dispatched,
     * and some part of the state tree may potentially have changed. You may then
     * call `getState()` to read the current state tree inside the callback.
     *
     * You may call `dispatch()` from a change listener, with the following
     * caveats:
     *
     * 1. The subscriptions are snapshotted just before every `dispatch()` call.
     * If you subscribe or unsubscribe while the listeners are being invoked, this
     * will not have any effect on the `dispatch()` that is currently in progress.
     * However, the next `dispatch()` call, whether nested or not, will use a more
     * recent snapshot of the subscription list.
     *
     * 2. The listener should not expect to see all state changes, as the state
     * might have been updated multiple times during a nested `dispatch()` before
     * the listener is called. It is, however, guaranteed that all subscribers
     * registered before the `dispatch()` started will be called with the latest
     * state by the time it exits.
     *
     * @param {Function} listener A callback to be invoked on every dispatch.
     * @returns {Function} A function to remove this change listener.
     */
    function subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new Error('Expected the listener to be a function.')
      }

      if (isDispatching) {
        throw new Error(
          'You may not call store.subscribe() while the reducer is executing. ' +
            'If you would like to be notified after the store has been updated, subscribe from a ' +
            'component and invoke store.getState() in the callback to access the latest state. ' +
            'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
        )
      }

      let isSubscribed = true;

      ensureCanMutateNextListeners();
      nextListeners.push(listener);

      return function unsubscribe() {
        if (!isSubscribed) {
          return
        }

        if (isDispatching) {
          throw new Error(
            'You may not unsubscribe from a store listener while the reducer is executing. ' +
              'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
          )
        }

        isSubscribed = false;

        ensureCanMutateNextListeners();
        const index = nextListeners.indexOf(listener);
        nextListeners.splice(index, 1);
      }
    }

    /**
     * Dispatches an action. It is the only way to trigger a state change.
     *
     * The `reducer` function, used to create the store, will be called with the
     * current state tree and the given `action`. Its return value will
     * be considered the **next** state of the tree, and the change listeners
     * will be notified.
     *
     * The base implementation only supports plain object actions. If you want to
     * dispatch a Promise, an Observable, a thunk, or something else, you need to
     * wrap your store creating function into the corresponding middleware. For
     * example, see the documentation for the `redux-thunk` package. Even the
     * middleware will eventually dispatch plain object actions using this method.
     *
     * @param {Object} action A plain object representing “what changed”. It is
     * a good idea to keep actions serializable so you can record and replay user
     * sessions, or use the time travelling `redux-devtools`. An action must have
     * a `type` property which may not be `undefined`. It is a good idea to use
     * string constants for action types.
     *
     * @returns {Object} For convenience, the same action object you dispatched.
     *
     * Note that, if you use a custom middleware, it may wrap `dispatch()` to
     * return something else (for example, a Promise you can await).
     */
    function dispatch(action) {
      if (!isPlainObject(action)) {
        throw new Error(
          'Actions must be plain objects. ' +
            'Use custom middleware for async actions.'
        )
      }

      if (typeof action.type === 'undefined') {
        throw new Error(
          'Actions may not have an undefined "type" property. ' +
            'Have you misspelled a constant?'
        )
      }

      if (isDispatching) {
        throw new Error('Reducers may not dispatch actions.')
      }

      try {
        isDispatching = true;
        currentState = currentReducer(currentState, action);
      } finally {
        isDispatching = false;
      }

      const listeners = (currentListeners = nextListeners);
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        listener();
      }

      return action
    }

    /**
     * Replaces the reducer currently used by the store to calculate the state.
     *
     * You might need this if your app implements code splitting and you want to
     * load some of the reducers dynamically. You might also need this if you
     * implement a hot reloading mechanism for Redux.
     *
     * @param {Function} nextReducer The reducer for the store to use instead.
     * @returns {void}
     */
    function replaceReducer(nextReducer) {
      if (typeof nextReducer !== 'function') {
        throw new Error('Expected the nextReducer to be a function.')
      }

      currentReducer = nextReducer;
      dispatch({ type: ActionTypes.REPLACE });
    }

    /**
     * Interoperability point for observable/reactive libraries.
     * @returns {observable} A minimal observable of state changes.
     * For more information, see the observable proposal:
     * https://github.com/tc39/proposal-observable
     */
    function observable() {
      const outerSubscribe = subscribe;
      return {
        /**
         * The minimal observable subscription method.
         * @param {Object} observer Any object that can be used as an observer.
         * The observer object should have a `next` method.
         * @returns {subscription} An object with an `unsubscribe` method that can
         * be used to unsubscribe the observable from the store, and prevent further
         * emission of values from the observable.
         */
        subscribe(observer) {
          if (typeof observer !== 'object' || observer === null) {
            throw new TypeError('Expected the observer to be an object.')
          }

          function observeState() {
            if (observer.next) {
              observer.next(getState());
            }
          }

          observeState();
          const unsubscribe = outerSubscribe(observeState);
          return { unsubscribe }
        },

        [$$observable]() {
          return this
        }
      }
    }

    // When a store is created, an "INIT" action is dispatched so that every
    // reducer returns their initial state. This effectively populates
    // the initial state tree.
    dispatch({ type: ActionTypes.INIT });

    return {
      dispatch,
      subscribe,
      getState,
      replaceReducer,
      [$$observable]: observable
    }
  }

  /**
   * Prints a warning in the console if it exists.
   *
   * @param {String} message The warning message.
   * @returns {void}
   */
  function warning(message) {
    /* eslint-disable no-console */
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
      console.error(message);
    }
    /* eslint-enable no-console */
    try {
      // This error was thrown as a convenience so that if you enable
      // "break on all exceptions" in your console,
      // it would pause the execution at this line.
      throw new Error(message)
    } catch (e) {} // eslint-disable-line no-empty
  }

  function getUndefinedStateErrorMessage(key, action) {
    const actionType = action && action.type;
    const actionDescription =
      (actionType && `action "${String(actionType)}"`) || 'an action';

    return (
      `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
      `To ignore an action, you must explicitly return the previous state. ` +
      `If you want this reducer to hold no value, you can return null instead of undefined.`
    )
  }

  function getUnexpectedStateShapeWarningMessage(
    inputState,
    reducers,
    action,
    unexpectedKeyCache
  ) {
    const reducerKeys = Object.keys(reducers);
    const argumentName =
      action && action.type === ActionTypes.INIT
        ? 'preloadedState argument passed to createStore'
        : 'previous state received by the reducer';

    if (reducerKeys.length === 0) {
      return (
        'Store does not have a valid reducer. Make sure the argument passed ' +
        'to combineReducers is an object whose values are reducers.'
      )
    }

    if (!isPlainObject(inputState)) {
      return (
        `The ${argumentName} has unexpected type of "` +
        {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
        `". Expected argument to be an object with the following ` +
        `keys: "${reducerKeys.join('", "')}"`
      )
    }

    const unexpectedKeys = Object.keys(inputState).filter(
      key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
    );

    unexpectedKeys.forEach(key => {
      unexpectedKeyCache[key] = true;
    });

    if (action && action.type === ActionTypes.REPLACE) return

    if (unexpectedKeys.length > 0) {
      return (
        `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
        `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
        `Expected to find one of the known reducer keys instead: ` +
        `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
      )
    }
  }

  function assertReducerShape(reducers) {
    Object.keys(reducers).forEach(key => {
      const reducer = reducers[key];
      const initialState = reducer(undefined, { type: ActionTypes.INIT });

      if (typeof initialState === 'undefined') {
        throw new Error(
          `Reducer "${key}" returned undefined during initialization. ` +
            `If the state passed to the reducer is undefined, you must ` +
            `explicitly return the initial state. The initial state may ` +
            `not be undefined. If you don't want to set a value for this reducer, ` +
            `you can use null instead of undefined.`
        )
      }

      if (
        typeof reducer(undefined, {
          type: ActionTypes.PROBE_UNKNOWN_ACTION()
        }) === 'undefined'
      ) {
        throw new Error(
          `Reducer "${key}" returned undefined when probed with a random type. ` +
            `Don't try to handle ${
            ActionTypes.INIT
          } or other actions in "redux/*" ` +
            `namespace. They are considered private. Instead, you must return the ` +
            `current state for any unknown actions, unless it is undefined, ` +
            `in which case you must return the initial state, regardless of the ` +
            `action type. The initial state may not be undefined, but can be null.`
        )
      }
    });
  }

  /**
   * Turns an object whose values are different reducer functions, into a single
   * reducer function. It will call every child reducer, and gather their results
   * into a single state object, whose keys correspond to the keys of the passed
   * reducer functions.
   *
   * @param {Object} reducers An object whose values correspond to different
   * reducer functions that need to be combined into one. One handy way to obtain
   * it is to use ES6 `import * as reducers` syntax. The reducers may never return
   * undefined for any action. Instead, they should return their initial state
   * if the state passed to them was undefined, and the current state for any
   * unrecognized action.
   *
   * @returns {Function} A reducer function that invokes every reducer inside the
   * passed object, and builds a state object with the same shape.
   */
  function combineReducers(reducers) {
    const reducerKeys = Object.keys(reducers);
    const finalReducers = {};
    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i];

      if (process.env.NODE_ENV !== 'production') {
        if (typeof reducers[key] === 'undefined') {
          warning(`No reducer provided for key "${key}"`);
        }
      }

      if (typeof reducers[key] === 'function') {
        finalReducers[key] = reducers[key];
      }
    }
    const finalReducerKeys = Object.keys(finalReducers);

    let unexpectedKeyCache;
    if (process.env.NODE_ENV !== 'production') {
      unexpectedKeyCache = {};
    }

    let shapeAssertionError;
    try {
      assertReducerShape(finalReducers);
    } catch (e) {
      shapeAssertionError = e;
    }

    return function combination(state = {}, action) {
      if (shapeAssertionError) {
        throw shapeAssertionError
      }

      if (process.env.NODE_ENV !== 'production') {
        const warningMessage = getUnexpectedStateShapeWarningMessage(
          state,
          finalReducers,
          action,
          unexpectedKeyCache
        );
        if (warningMessage) {
          warning(warningMessage);
        }
      }

      let hasChanged = false;
      const nextState = {};
      for (let i = 0; i < finalReducerKeys.length; i++) {
        const key = finalReducerKeys[i];
        const reducer = finalReducers[key];
        const previousStateForKey = state[key];
        const nextStateForKey = reducer(previousStateForKey, action);
        if (typeof nextStateForKey === 'undefined') {
          const errorMessage = getUndefinedStateErrorMessage(key, action);
          throw new Error(errorMessage)
        }
        nextState[key] = nextStateForKey;
        hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
      }
      return hasChanged ? nextState : state
    }
  }

  function bindActionCreator(actionCreator, dispatch) {
    return function() {
      return dispatch(actionCreator.apply(this, arguments))
    }
  }

  /**
   * Turns an object whose values are action creators, into an object with the
   * same keys, but with every function wrapped into a `dispatch` call so they
   * may be invoked directly. This is just a convenience method, as you can call
   * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
   *
   * For convenience, you can also pass a single function as the first argument,
   * and get a function in return.
   *
   * @param {Function|Object} actionCreators An object whose values are action
   * creator functions. One handy way to obtain it is to use ES6 `import * as`
   * syntax. You may also pass a single function.
   *
   * @param {Function} dispatch The `dispatch` function available on your Redux
   * store.
   *
   * @returns {Function|Object} The object mimicking the original object, but with
   * every action creator wrapped into the `dispatch` call. If you passed a
   * function as `actionCreators`, the return value will also be a single
   * function.
   */
  function bindActionCreators(actionCreators, dispatch) {
    if (typeof actionCreators === 'function') {
      return bindActionCreator(actionCreators, dispatch)
    }

    if (typeof actionCreators !== 'object' || actionCreators === null) {
      throw new Error(
        `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? 'null' : typeof actionCreators
      }. ` +
          `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
      )
    }

    const keys = Object.keys(actionCreators);
    const boundActionCreators = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const actionCreator = actionCreators[key];
      if (typeof actionCreator === 'function') {
        boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
      }
    }
    return boundActionCreators
  }

  /**
   * Composes single-argument functions from right to left. The rightmost
   * function can take multiple arguments as it provides the signature for
   * the resulting composite function.
   *
   * @param {...Function} funcs The functions to compose.
   * @returns {Function} A function obtained by composing the argument functions
   * from right to left. For example, compose(f, g, h) is identical to doing
   * (...args) => f(g(h(...args))).
   */

  function compose(...funcs) {
    if (funcs.length === 0) {
      return arg => arg
    }

    if (funcs.length === 1) {
      return funcs[0]
    }

    return funcs.reduce((a, b) => (...args) => a(b(...args)))
  }

  /**
   * Creates a store enhancer that applies middleware to the dispatch method
   * of the Redux store. This is handy for a variety of tasks, such as expressing
   * asynchronous actions in a concise manner, or logging every action payload.
   *
   * See `redux-thunk` package as an example of the Redux middleware.
   *
   * Because middleware is potentially asynchronous, this should be the first
   * store enhancer in the composition chain.
   *
   * Note that each middleware will be given the `dispatch` and `getState` functions
   * as named arguments.
   *
   * @param {...Function} middlewares The middleware chain to be applied.
   * @returns {Function} A store enhancer applying the middleware.
   */
  function applyMiddleware(...middlewares) {
    return createStore => (...args) => {
      const store = createStore(...args);
      let dispatch = () => {
        throw new Error(
          `Dispatching while constructing your middleware is not allowed. ` +
            `Other middleware would not be applied to this dispatch.`
        )
      };

      const middlewareAPI = {
        getState: store.getState,
        dispatch: (...args) => dispatch(...args)
      };
      const chain = middlewares.map(middleware => middleware(middlewareAPI));
      dispatch = compose(...chain)(store.dispatch);

      return {
        ...store,
        dispatch
      }
    }
  }

  /*
   * This is a dummy function to check if the function name has been altered by minification.
   * If the function has been minified and NODE_ENV !== 'production', warn the user.
   */
  function isCrushed() {}

  if (
    process.env.NODE_ENV !== 'production' &&
    typeof isCrushed.name === 'string' &&
    isCrushed.name !== 'isCrushed'
  ) {
    warning(
      'You are currently using minified code outside of NODE_ENV === "production". ' +
        'This means that you are running a slower development build of Redux. ' +
        'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' +
        'or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) ' +
        'to ensure you have the correct code for your production build.'
    );
  }

  exports.createStore = createStore;
  exports.combineReducers = combineReducers;
  exports.bindActionCreators = bindActionCreators;
  exports.applyMiddleware = applyMiddleware;
  exports.compose = compose;
  exports.__DO_NOT_USE__ActionTypes = ActionTypes;

  return exports;

}({},$$observable));