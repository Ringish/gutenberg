/**
 * External dependencies
 */
import { View, AccessibilityInfo } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	withInstanceId,
	compose,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	RichText,
	withColors,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	TextControl,
	ToggleControl,
	PanelBody,
	RangeControl,
	UnsupportedFooterControl,
} from '@wordpress/components';
import {
	Component,
} from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import richTextStyle from './rich-text.scss';
import styles from './editor.scss';
import ColorBackground from './color-background.native';

const NEW_TAB_REL = 'noreferrer noopener';
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_MAX_WIDTH = 108;

class ButtonEdit extends Component {
	constructor( props ) {
		super( props );
		this.onChangeBorderRadius = this.onChangeBorderRadius.bind( this );
		this.onChangeLinkRel = this.onChangeLinkRel.bind( this );
		this.onChangeOpenInNewTab = this.onChangeOpenInNewTab.bind( this );
		this.onChangeURL = this.onChangeURL.bind( this );
		this.onLayout = this.onLayout.bind( this );

		this.state = {
			maxWidth: INITIAL_MAX_WIDTH,
		};
	}

	componentDidUpdate( prevProps ) {
		const { selectedId } = this.props;

		if ( this.richTextRef ) {
			const selectedRichText = this.richTextRef.props.id === selectedId;
			const isFocused = this.richTextRef.isFocused();

			if ( selectedRichText && selectedId !== prevProps.selectedId && ! isFocused ) {
				AccessibilityInfo.isScreenReaderEnabled().then(
					( enabled ) => {
						if ( enabled ) {
							this.richTextRef.focus();
						}
					}
				);
			}
		}
	}

	getBackgroundColor() {
		const { backgroundColor, attributes } = this.props;
		if ( backgroundColor.color ) {
			// `backgroundColor` which should be set when we are able to resolve it
			return backgroundColor.color;
		} else if ( attributes.backgroundColor ) {
			// `backgroundColor` which should be set when we can’t resolve
			// the button `backgroundColor` that was created on web
			return styles.fallbackButton.backgroundColor;
		// `backgroundColor` which should be set when `Button` is created on mobile
		} return styles.button.backgroundColor;
	}

	onChangeBorderRadius( value ) {
		const { setAttributes } = this.props;
		setAttributes( {
			borderRadius: value,
		} );
	}

	onChangeLinkRel( value ) {
		const { setAttributes } = this.props;
		setAttributes( { rel: value } );
	}

	onChangeURL( value ) {
		const { setAttributes } = this.props;
		setAttributes( { url: value } );
	}

	onLayout( { nativeEvent } ) {
		const { width } = nativeEvent.layout;
		const { marginRight, paddingRight, borderWidth } = styles.button;
		const buttonSpacing = 2 * ( marginRight + paddingRight + borderWidth );
		this.setState( { maxWidth: width - buttonSpacing } );
	}

	onChangeOpenInNewTab( value ) {
		const { setAttributes, attributes } = this.props;
		const { rel } = attributes;

		const newLinkTarget = value ? '_blank' : undefined;

		let updatedRel = rel;
		if ( newLinkTarget && ! rel ) {
			updatedRel = NEW_TAB_REL;
		} else if ( ! newLinkTarget && rel === NEW_TAB_REL ) {
			updatedRel = undefined;
		}

		setAttributes( {
			linkTarget: newLinkTarget,
			rel: updatedRel,
		} );
	}

	render() {
		const { attributes, setAttributes, textColor, isSelected, clientId } = this.props;
		const {
			placeholder,
			text,
			borderRadius,
			url,
			linkTarget,
			rel,
		} = attributes;
		const { maxWidth } = this.state;

		const isFocused = this.richTextRef && this.richTextRef.isFocused();

		const borderRadiusValue = borderRadius !== undefined ? borderRadius : styles.button.borderRadius;
		const outlineBorderRadius = borderRadiusValue > 0 ? borderRadiusValue + styles.button.paddingTop + styles.button.borderWidth : 0;

		// To achieve proper expanding and shrinking `RichText` on iOS, there is a need to set a `minWidth`
		// value at least on 1 when `RichText` is focused or when is not focused, but `RichText` value is
		// different than empty string.
		const minWidth = isFocused || ( ! isFocused && text && text !== '' ) ? 1 : styles.button.minWidth;
		// To achieve proper expanding and shrinking `RichText` on Android, there is a need to set
		// a `placeholder` as an empty string when `RichText` is focused,
		// because `AztecView` is calculating a `minWidth` based on placeholder text.
		const placeholderText = isFocused || ( ! isFocused && text && text !== '' ) ? '' : ( placeholder || __( 'Add text…' ) );

		return (
			<View
				style={ { flex: 1 } }
				onLayout={ this.onLayout }
			>
				<View
					style={ [
						styles.container,
						isSelected && {
							borderColor: this.getBackgroundColor(),
							borderRadius: outlineBorderRadius,
							borderWidth: styles.button.borderWidth,
						},
					] }
				>
					<ColorBackground
						borderRadiusValue={ borderRadiusValue }
						backgroundColor={ this.getBackgroundColor() }
					>
						<RichText
							setRef={ ( richText ) => {
								this.richTextRef = richText;
							} }
							placeholder={ placeholderText }
							value={ text }
							onChange={ ( value ) => setAttributes( { text: value } ) }
							style={ {
								...richTextStyle.richText,
								color: textColor.color || '#fff',
							} }
							textAlign="center"
							placeholderTextColor={ 'lightgray' }
							identifier="content"
							tagName="p"
							minWidth={ minWidth }
							maxWidth={ maxWidth }
							id={ clientId }
						/>
					</ColorBackground>

					<InspectorControls>
						<PanelBody title={ __( 'Border Settings' ) } >
							<RangeControl
								label={ __( 'Border Radius' ) }
								minimumValue={ MIN_BORDER_RADIUS_VALUE }
								maximumValue={ MAX_BORDER_RADIUS_VALUE }
								value={ borderRadiusValue }
								onChange={ this.onChangeBorderRadius }
								separatorType="none"
							/>
						</PanelBody>
						<PanelBody title={ __( 'Link Settings' ) } >
							<TextControl
								label={ __( 'Button URL' ) }
								value={ url || '' }
								valuePlaceholder={ __( 'Add URL' ) }
								onChange={ this.onChangeURL }
								autoCapitalize="none"
								autoCorrect={ false }
								separatorType="none"
								keyboardType="url"
							/>
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								checked={ linkTarget === '_blank' }
								onChange={ this.onChangeOpenInNewTab }
								separatorType="fullWidth"
							/>
							<TextControl
								label={ __( 'Link Rel' ) }
								value={ rel || '' }
								valuePlaceholder={ __( 'None' ) }
								onChange={ this.onChangeLinkRel }
								autoCapitalize="none"
								autoCorrect={ false }
								separatorType="none"
								keyboardType="url"
							/>
						</PanelBody>
						<PanelBody title={ __( 'Color Settings' ) } >
							<UnsupportedFooterControl
								label={ __( 'Note: Theme colors are not available at this time.' ) }
								separatorType="none"
							/>
						</PanelBody>
					</InspectorControls>
				</View>
			</View>
		);
	}
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( 'core/block-editor' );

		const selectedId = getSelectedBlockClientId();

		return {
			selectedId,
		};
	} ),
] )( ButtonEdit );