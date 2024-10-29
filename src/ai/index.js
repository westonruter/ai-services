/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';
import servicesStoreConfig from './services';
import chatStoreConfig from './chat';
import combineStores from '../utils/combine-stores';

const storeConfig = combineStores( servicesStoreConfig, chatStoreConfig );

export const store = createReduxStore( STORE_NAME, storeConfig );
register( store );

/*
 * For backward compatibility, expose the store object under 'aiServices.aiStore' as it used to be, while now it is
 * available under 'aiServices.ai'.
 * TODO: Remove this in the future.
 */
if ( ! window.aiServices ) {
	window.aiServices = {};
}
window.aiServices.aiStore = {
	/**
	 * BC wrapper to get the store object, while warning about deprecation.
	 *
	 * @return {Object} The store object.
	 */
	get store() {
		window.console.warn(
			'aiServices.aiStore is deprecated as of version n.e.x.t. Use aiServices.ai instead.'
		);
		return store;
	},
};