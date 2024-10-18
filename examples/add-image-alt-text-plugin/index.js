/*
 * Props to https://github.com/swissspidy, since most of this code is copied or at least heavily inspired from his code
 * in https://github.com/swissspidy/ai-experiments/blob/main/packages/editor/src/blockControls/imageControls.tsx and in
 * https://github.com/swissspidy/ai-experiments/blob/main/packages/editor/src/blockControls/index.tsx.
 */

const { createHigherOrderComponent } = wp.compose;
const { Icon, ToolbarButton } = wp.components;
const { useSelect } = wp.data;
const { createElement, useState, Fragment } = wp.element;
const { addFilter } = wp.hooks;
const { BlockControls } = wp.blockEditor;
const { store: aiStore } = window.aiServices.aiStore;
const { __ } = wp.i18n;

const AI_CAPABILITIES = [ 'multimodal_input', 'text_generation' ];

function ImageIcon() {
	return createElement( Icon, { icon: 'format-image' } );
}

function getMimeType( url ) {
	const extension = url.split( '.' ).pop().toLowerCase();
	switch ( extension ) {
		case 'png':
			return 'image/png';
		case 'gif':
			return 'image/gif';
		case 'avif':
			return 'image/avif';
		case 'webp':
			return 'image/webp';
		case 'jpg':
		case 'jpeg':
		default:
			return 'image/jpeg';
	}
}

async function getBase64Image( url ) {
	const data = await fetch( url );
	const blob = await data.blob();
	return new Promise( ( resolve ) => {
		const reader = new FileReader();
		reader.readAsDataURL( blob );
		reader.onloadend = () => {
			const base64data = reader.result;
			resolve( base64data );
		}
	} );
}

function ImageControls( { attributes, setAttributes } ) {
	const [ inProgress, setInProgress ] = useState( false );

	const service = useSelect( ( select ) =>
		select( aiStore ).getAvailableService( AI_CAPABILITIES )
	);
	if ( ! service ) {
		return;
	}

	if ( ! attributes.url ) {
		return null;
	}

	const generateAltText = async () => {
		setInProgress( true );

		const mimeType = getMimeType( attributes.url );
		const base64Image = await getBase64Image( attributes.url );

		let candidates;
		try {
			candidates = await service.generateText(
				{
					role: 'user',
					parts: [
						{
							text: __(
								'Create a brief description of what the following image shows, suitable as alternative text for screen readers.',
								'add-image-alt-text-plugin'
							),
						},
						{
							inlineData: {
								mimeType,
								data: base64Image,
							},
						},
					],
				},
				{
					feature: 'add-image-alt-text-plugin',
					capabilities: AI_CAPABILITIES,
				}
			);
		} catch ( error ) {
			window.console.error( error );
			setInProgress( false );
			return;
		}

		const alt = candidates[ 0 ].content.parts[ 0 ].text.replaceAll(
			'\n\n\n\n',
			'\n\n'
		);

		setAttributes( { alt } );
		setInProgress( false );
	};

	return createElement(
		BlockControls,
		{ group: 'inline' },
		createElement( ToolbarButton, {
			label: __( 'Write alternative text', 'add-image-alt-text-plugin' ),
			icon: ImageIcon,
			showTooltip: true,
			disabled: inProgress,
			onClick: generateAltText,
		} ),
	);
}

const addAiControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name === 'core/image' ) {
			return createElement(
				Fragment,
				null,
				createElement( BlockEdit, props ),
				createElement( ImageControls, props ),
			);
		}

		return createElement( BlockEdit, props );
	},
	'withAiControls'
);
addFilter(
	'editor.BlockEdit',
	'add-image-alt-text-plugin/add-ai-controls',
	addAiControls
);
