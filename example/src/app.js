import HysteresisNav from './libs/storm-hysteresis-nav';

const onDOMContentLoadedTasks = [() => {
	HysteresisNav.init('.js-nav');
}];
    
if('addEventListener' in window) window.addEventListener('DOMContentLoaded', () => { onDOMContentLoadedTasks.forEach((fn) => fn()); });