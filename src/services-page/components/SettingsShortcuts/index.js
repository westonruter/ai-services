/**
 * External dependencies
 */
import { store as pluginSettingsStore } from '@wp-starter-plugin/settings-store';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Renders a utility component to add event listeners for keyboard shortcuts for the settings app.
 *
 * @since n.e.x.t
 *
 * @return {Component} The component to be rendered.
 */
export default function SettingsShortcuts() {
	const { saveSettings } = useDispatch( pluginSettingsStore );

	const handleSave = ( event ) => {
		event.preventDefault();
		saveSettings();
	};
	useShortcut( 'wp-starter-plugin/save', handleSave );

	return null;
}
