/*
 * @Author: Kanata You 
 * @Date: 2020-12-05 19:55:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-06 15:47:58
 */

import { createStore, combineReducers } from "redux";
import { DataRedux } from "./DataCenter";


// 全局的所有 reducer
const rootReducers = combineReducers({ DataRedux });

// 第二个可选参数用于初始化
const store = createStore(rootReducers, {});


export default store;
