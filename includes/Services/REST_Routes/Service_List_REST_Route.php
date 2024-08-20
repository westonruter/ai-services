<?php
/**
 * Class Vendor_NS\WP_Starter_Plugin\Services\REST_Routes\Service_List_REST_Route
 *
 * @since n.e.x.t
 * @package wp-starter-plugin
 */

namespace Vendor_NS\WP_Starter_Plugin\Services\REST_Routes;

use Vendor_NS\WP_Starter_Plugin\Services\Services_API;
use Vendor_NS\WP_Starter_Plugin_Dependencies\Felix_Arntz\WP_OOP_Plugin_Lib\General\Current_User;
use Vendor_NS\WP_Starter_Plugin_Dependencies\Felix_Arntz\WP_OOP_Plugin_Lib\REST_Routes\Abstract_REST_Route;
use Vendor_NS\WP_Starter_Plugin_Dependencies\Felix_Arntz\WP_OOP_Plugin_Lib\REST_Routes\Exception\REST_Exception;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class representing the REST API route for listing services.
 *
 * @since n.e.x.t
 */
class Service_List_REST_Route extends Abstract_REST_Route {
	const BASE    = '/services';
	const METHODS = WP_REST_Server::READABLE;

	/**
	 * The services API instance.
	 *
	 * @since n.e.x.t
	 * @var Services_API
	 */
	private $services_api;

	/**
	 * Current user service.
	 *
	 * @since n.e.x.t
	 * @var Current_User
	 */
	private $current_user;

	/**
	 * Relevant resource schema.
	 *
	 * @since n.e.x.t
	 * @var Service_REST_Resource_Schema
	 */
	private $resource_schema;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Services_API                 $services_api    The services API instance.
	 * @param Current_User                 $current_user    The current user service.
	 * @param Service_REST_Resource_Schema $resource_schema The relevant resource schema.
	 */
	public function __construct( Services_API $services_api, Current_User $current_user, Service_REST_Resource_Schema $resource_schema ) {
		$this->services_api    = $services_api;
		$this->current_user    = $current_user;
		$this->resource_schema = $resource_schema;

		parent::__construct();
	}

	/**
	 * Returns the route base.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Route base.
	 */
	protected function base(): string {
		return self::BASE;
	}

	/**
	 * Returns the route methods, as a comma-separated string.
	 *
	 * @since n.e.x.t
	 *
	 * @return string Route methods, as a comma-separated string.
	 */
	protected function methods(): string {
		return self::METHODS;
	}

	/**
	 * Checks the required permissions for the given request and throws an exception if they aren't met.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_REST_Request $request WordPress REST request object, including parameters.
	 *
	 * @throws REST_Exception Thrown when the permissions aren't met, or when a REST error occurs.
	 */
	protected function check_permissions( WP_REST_Request $request ): void /* @phpstan-ignore-line */ {
		if ( 'edit' === $request['context'] && ! $this->current_user->has_cap( 'wpsp_manage_services' ) ) {
			throw REST_Exception::create(
				'rest_forbidden_context',
				esc_html__( 'Sorry, you are not allowed to manage services.', 'wp-starter-plugin' ),
				$this->current_user->is_logged_in() ? 403 : 401
			);
		}

		if ( ! $this->current_user->has_cap( 'wpsp_access_services' ) ) {
			throw REST_Exception::create(
				'rest_cannot_view',
				esc_html__( 'Sorry, you are not allowed to access services.', 'wp-starter-plugin' ),
				$this->current_user->is_logged_in() ? 403 : 401
			);
		}
	}

	/**
	 * Handles the given request and returns a response.
	 *
	 * @since n.e.x.t
	 *
	 * @param WP_REST_Request $request WordPress REST request object, including parameters.
	 * @return WP_REST_Response WordPress REST response object.
	 *
	 * @throws REST_Exception Thrown when a REST error occurs.
	 */
	protected function handle_request( WP_REST_Request $request ): WP_REST_Response /* @phpstan-ignore-line */ {
		$query_args = $this->request_pagination_to_query_args( $request );
		foreach ( array_keys( $this->get_query_args() ) as $arg ) {
			if ( isset( $request[ $arg ] ) ) {
				$query_args[ $arg ] = $request[ $arg ];
			}
		}

		$query = new Service_Entity_Query( $this->services_api, $query_args );

		return $this->resource_schema->prepare_resources_for_query( $query, $request );
	}

	/**
	 * Returns the route specific arguments.
	 *
	 * @since n.e.x.t
	 *
	 * @return array<string, mixed> Route arguments.
	 */
	protected function args(): array {
		return array_merge(
			$this->resource_schema->get_schema_args( self::METHODS ),
			$this->get_pagination_args(),
			$this->get_query_args()
		);
	}

	/**
	 * Returns the global route arguments.
	 *
	 * @since n.e.x.t
	 *
	 * @return array<string, mixed> Global route arguments.
	 */
	protected function global_args(): array {
		return array(
			'allow_batch' => array( 'v1' => true ),
			'schema'      => array( $this->resource_schema, 'get_public_schema' ),
		);
	}

	/**
	 * Returns the route specific arguments that map directly to a service query.
	 *
	 * @since n.e.x.t
	 *
	 * @return array<string, mixed> Service query arguments for the route.
	 */
	protected function get_query_args(): array {
		static $args = null;

		if ( null === $args ) {
			$args = array(
				'order'   => array(
					'description' => __( 'Order sort attribute ascending or descending.', 'wp-starter-plugin' ),
					'type'        => 'string',
					'default'     => 'asc',
					'enum'        => array( 'asc', 'desc' ),
				),
				'orderby' => array(
					'description' => __( 'Sort results by service attribute.', 'wp-starter-plugin' ),
					'type'        => 'string',
					'default'     => 'slug',
					'enum'        => array( 'slug' ),
				),
			);
		}

		return $args;
	}
}