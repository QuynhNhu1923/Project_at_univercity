// src/reducers/store.js
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { thunk } from 'redux-thunk';
import helpReducer from './help';
import helpSider from './helpSider';
import sider from './sider';
import modal from './modal';
import target from './target'

// Kết hợp các reducers lại
const rootReducer = combineReducers({
  helpReducer,
  helpSider,
  sider,
  modal,
  target
});

// Cấu hình middleware và Redux DevTools
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);

export default store;
