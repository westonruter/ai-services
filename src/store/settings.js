/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createRegistrySelector, createSelector } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './name';

const RECEIVE_SETTINGS = 'RECEIVE_SETTINGS';
const SAVE_SETTINGS_START = 'SAVE_SETTINGS_START';
const SAVE_SETTINGS_FINISH = 'SAVE_SETTINGS_FINISH';
const SET_DELETE_DATA = 'SET_DELETE_DATA';

const SAVE_SETTINGS_NOTICE_ID = 'SAVE_SETTINGS_NOTICE_ID';

/**
 * Updates the modified settings object with the new settings, if they differ from the saved settings.
 *
 * For new settings that are now different from the saved settings, they will be added to the modified settings.
 * For new settings that are now equal to the saved settings, they will be removed from the modified settings.
 *
 * @since n.e.x.t
 *
 * @param {Object} modifiedSettings The modified settings object, as key value pairs.
 * @param {Object} savedSettings    The saved settings object, as key value pairs.
 * @param {Object} newSettings      The new settings object, as key value pairs.
 * @return {Object} The updated modified settings object.
 */
function updateModifiedSettings(
	modifiedSettings,
	savedSettings,
	newSettings
) {
	const updatedSettings = { ...modifiedSettings };

	let hasChanges = false;
	Object.keys( newSettings ).forEach( ( key ) => {
		if ( newSettings[ key ] === modifiedSettings[ key ] ) {
			return;
		}

		hasChanges = true;
		if ( newSettings[ key ] !== savedSettings[ key ] ) {
			updatedSettings[ key ] = newSettings[ key ];
		} else {
			delete updatedSettings[ key ];
		}
	} );

	/*
	 * If there are no changes at all, return the original object to avoid
	 * unnecessary re-renders.
	 */
	if ( ! hasChanges ) {
		return modifiedSettings;
	}

	return updatedSettings;
}

const initialState = {
	savedSettings: undefined,
	modifiedSettings: {},
	isSavingSettings: false,
};

const actions = {
	/**
	 * Receives settings from the server.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} settings Settings received from the server, as key value pairs.
	 * @return {Function} Action creator.
	 */
	receiveSettings( settings ) {
		return ( { dispatch } ) => {
			dispatch( {
				type: RECEIVE_SETTINGS,
				payload: {
					settings: { deleteData: settings.wpsp_delete_data },
				},
			} );
		};
	},

	/**
	 * Saves all settings to the server.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Function} Action creator.
	 */
	saveSettings() {
		return async ( { dispatch, select, registry } ) => {
			if ( ! select.areSettingsSaveable() ) {
				return;
			}

			const settings = select.getSettings();

			await dispatch( {
				type: SAVE_SETTINGS_START,
				payload: {},
			} );

			let updatedSettings;
			try {
				updatedSettings = await apiFetch( {
					path: '/wp/v2/settings',
					method: 'POST',
					data: {
						wpsp_delete_data: settings.deleteData,
					},
				} );
			} catch ( error ) {
				console.error( error?.message || error ); // eslint-disable-line no-console
			}

			if ( updatedSettings ) {
				await dispatch.receiveSettings( updatedSettings );
			}

			await dispatch( {
				type: SAVE_SETTINGS_FINISH,
				payload: {},
			} );

			if ( updatedSettings ) {
				registry
					.dispatch( noticesStore )
					.createSuccessNotice(
						__(
							'Settings successfully saved.',
							'wp-starter-plugin'
						),
						{
							id: SAVE_SETTINGS_NOTICE_ID,
							type: 'snackbar',
							speak: true,
						}
					);
			} else {
				registry
					.dispatch( noticesStore )
					.createErrorNotice(
						__( 'Saving settings failed.', 'wp-starter-plugin' ),
						{
							id: SAVE_SETTINGS_NOTICE_ID,
							type: 'snackbar',
							speak: true,
						}
					);
			}
		};
	},

	/**
	 * Sets the value for the deleteData setting.
	 *
	 * @since n.e.x.t
	 *
	 * @param {boolean} deleteData The new deleteData value.
	 * @return {Object} Action object.
	 */
	setDeleteData( deleteData ) {
		return {
			type: SET_DELETE_DATA,
			payload: { deleteData },
		};
	},
};

/**
 * Reducer for the store mutations.
 *
 * @since n.e.x.t
 *
 * @param {Object} state  Current state.
 * @param {Object} action Action object.
 * @return {Object} New state.
 */
function reducer( state = initialState, action ) {
	switch ( action.type ) {
		case RECEIVE_SETTINGS: {
			const { settings } = action.payload;
			return {
				...state,
				savedSettings: settings,
				modifiedSettings: {},
			};
		}
		case SAVE_SETTINGS_START: {
			return {
				...state,
				isSavingSettings: true,
			};
		}
		case SAVE_SETTINGS_FINISH: {
			return {
				...state,
				isSavingSettings: false,
			};
		}
		case SET_DELETE_DATA: {
			const { deleteData } = action.payload;
			return {
				...state,
				modifiedSettings: updateModifiedSettings(
					state.modifiedSettings,
					state.savedSettings,
					{ deleteData }
				),
			};
		}
	}

	return state;
}

const resolvers = {
	/**
	 * Fetches the settings from the server.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Function} Action creator.
	 */
	getSettings() {
		return async ( { dispatch } ) => {
			const settings = await apiFetch( { path: '/wp/v2/settings' } );
			dispatch.receiveSettings( settings );
		};
	},
};

const selectors = {
	getSettings: createSelector(
		( state ) => {
			if ( ! state.savedSettings ) {
				return undefined;
			}
			return {
				...state.savedSettings,
				...state.modifiedSettings,
			};
		},
		( state ) => [ state.savedSettings, state.modifiedSettings ]
	),

	hasModifiedSettings: createSelector(
		( state ) => {
			return Object.keys( state.modifiedSettings ).length > 0;
		},
		( state ) => [ state.modifiedSettings ]
	),

	isSavingSettings: ( state ) => {
		return state.isSavingSettings;
	},

	areSettingsSaveable: createRegistrySelector( ( select ) => () => {
		if ( select( STORE_NAME ).isSavingSettings() ) {
			return false;
		}

		if ( ! select( STORE_NAME ).hasModifiedSettings() ) {
			return false;
		}

		const settings = select( STORE_NAME ).getSettings();
		return (
			settings !== undefined &&
			! select( STORE_NAME ).isResolving( 'getSettings' )
		);
	} ),

	getDeleteData: createRegistrySelector( ( select ) => () => {
		const settings = select( STORE_NAME ).getSettings();
		return settings?.deleteData;
	} ),
};

const storeConfig = {
	initialState,
	actions,
	reducer,
	resolvers,
	selectors,
};

export default storeConfig;
