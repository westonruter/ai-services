<?php
/**
 * Class Felix_Arntz\AI_Services\Services\Util\Transformer
 *
 * @since n.e.x.t
 * @package ai-services
 */

namespace Felix_Arntz\AI_Services\Services\Util;

use Felix_Arntz\AI_Services\Services\Types\Content;
use Felix_Arntz\AI_Services\Services\Types\Generation_Config;
use InvalidArgumentException;

/**
 * Class providing static methods for transforming data.
 *
 * @since n.e.x.t
 */
final class Transformer {

	/**
	 * Transforms the given content using the provided transformers.
	 *
	 * @since n.e.x.t
	 *
	 * @param Content                 $content       The content to transform.
	 * @param array<string, callable> $transformers  The transformers to use. Each transformer callback should accept
	 *                                               the content as its only parameter and return the transformed value
	 *                                               for its key.
	 * @return array<string, mixed> The transformed content.
	 *
	 * @throws InvalidArgumentException Thrown if a provided transformer is not callable.
	 */
	public static function transform_content( Content $content, array $transformers ): array {
		$data = array();

		foreach ( $transformers as $key => $transformer ) {
			if ( ! is_callable( $transformer ) ) {
				throw new InvalidArgumentException(
					esc_html(
						sprintf(
							/* translators: %s: key */
							__( 'The transformer for key %s is invalid.', 'ai-services' ),
							$key
						)
					)
				);
			}

			// Transform the value and set it if truthy.
			$value = $transformer( $content );
			if ( ! $value ) {
				continue;
			}
			$data[ $key ] = $value;
		}

		return $data;
	}

	/**
	 * Merges the given Generation_Config instance into the given parameters using the provided transformers.
	 *
	 * @since n.e.x.t
	 *
	 * @param array<string, mixed>    $params       The parameters to merge the generation config into.
	 * @param Generation_Config       $config       The generation config to use for the transformation.
	 * @param array<string, callable> $transformers The transformers to use. Each transformer callback should accept
	 *                                              the generation config as its only parameter and return the
	 *                                              transformed value for its key.
	 * @return array<string, mixed> The transformed parameters.
	 *
	 * @throws InvalidArgumentException Thrown if a provided transformer is not callable.
	 */
	public static function transform_generation_config_params( array $params, Generation_Config $config, array $transformers ): array {
		foreach ( $transformers as $key => $transformer ) {
			if ( ! is_callable( $transformer ) ) {
				throw new InvalidArgumentException(
					esc_html(
						sprintf(
							/* translators: %s: key */
							__( 'The transformer for key %s is invalid.', 'ai-services' ),
							$key
						)
					)
				);
			}

			// Already set parameters take precedence.
			if ( isset( $params[ $key ] ) ) {
				continue;
			}

			// Transform the value and set it if truthy.
			$value = $transformer( $config );
			if ( ! $value ) {
				continue;
			}
			$params[ $key ] = $value;
		}

		return $params;
	}
}