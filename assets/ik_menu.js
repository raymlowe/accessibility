;(function ( $, window, document, undefined ) {
 
	var pluginName = 'ik_menu',
	//1 - add instructions	
	defaults = {
			 'instructions': 'Use arrow keys to navigate between menuitems, spacebar to expand submenus, escape key to close submenus, enter to activate menuitems.'
		};
	 
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 */
	function Plugin( element, options ) {
		
		this._name = pluginName;
		this._defaults = defaults;
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		
		this.init();
	}
	
	/** Initializes plugin. */
	Plugin.prototype.init = function () {
		
		var id, $elem, plugin;
		
		plugin = this;
		id = 'menu' + $('.ik_menu').length; // generate unique id
		$elem = plugin.element;
		
		$elem.addClass('ik_menu')
			.attr({
				'id': id
			});
		
		$('<div/>') // add div element to be used with aria-described attribute of the menu
			.text(plugin.options.instructions) // get instruction text from plugin options
			.addClass('ik_readersonly') // hide element from visual display
			.attr({
				'id': id + '_instructions',
				'aria-hidden': 'true'  // 2 - hide element from screen readers to prevent it from being read twice
			})
			.appendTo(this.element);
			
		$elem.find('ul:eq(0)')
			.attr({
				'id': id,
				'role': 'menubar', // 3 - assign menubar role to the topmost ul element
		        'tabindex': 0,	//4 - make the UL focusable so instructions are read by:-----
		        'aria-labelledby': id + '_instructions' //5 - instructions read by aria-labelledby
			});
		
		//6 - For all submenus in the menu bar, we want to add the role="menu" and hide for now
		$elem.find('li>ul').attr({
		    'role': 'menu',
		    'aria-hidden': true // hide submenus from screen reader
		});
		
		
		plugin.menuitems = $elem.find('li') // setup menuitems
			.css({ 'list-style': 'none' })
			.each(function(i, el) {
				
				var $me, $link;
				
				$me = $(this);
				//7 - For all menu items, they need to be initially hidden with the following:
				$link = $me.find('>a').attr({
				    'role': 'menu',
				    'aria-hidden': true // hide submenus from screen reader
				});
				//8 - Each menu item should be have the correct role and not be tabbable initially. It should also be labelled
				$me.attr({
				    'role': 'menuitem', // assign menuitem rols
				    'tabindex': -1,  // remove from tab order
				    'aria-label': $link.text() // label with link text
				});
				
				//9 - for each menu item with a sub menu. We identify this and also define its current (popup) state
				$me.has('ul')
				 .attr({ // setup submenus
				    'aria-haspopup': true,
				    'aria-expanded': false
				    })
				.addClass('expandable');
			});
		
		plugin.selected = plugin.menuitems // setup selected menuitem
			.find('.selected')
			.attr({	//10 - When a menu item is selected, set aria-selected attribute and add keyboard access
				'tabindex': 0,
		        'aria-selected': true
			})
		;
		
		if (!plugin.selected.length) {
			
			plugin.menuitems
				.eq(0)
				.attr({
					'tabindex': 0	//11 - add keyboard access back to menu items
				})
			;
			
		} else {
			
			plugin.selected
				.parentsUntil('nav', 'li')
				.attr({
					'tabindex': 0	//12 - add keyboard access back to menu items
				})
			;
			
		}
		
		plugin.menuitems // setup event handlers
			.on('mouseenter', plugin.showSubmenu)
			.on('mouseleave', plugin.hideSubmenu)
			.on('click', {'plugin': plugin}, plugin.activateMenuItem)
			.on("keydown", {'plugin': plugin}, plugin.onKeyDown)	//13 - wireup keyboard access class
		;
			
		$(window).on('resize', function(){ plugin.collapseAll(plugin); } ); // collapse all submenues when window is resized
		
	};
	
	/** 
	 * Shows submenu.
	 * 
	 * @param {object} event - Mouse event.
	 */
	Plugin.prototype.showSubmenu = function(event) {
		
		var $elem, $submenu;
		
		$elem = $(event.currentTarget);
		$submenu = $elem.children('ul');
		
		if ($submenu.length) {
			$elem.addClass('expanded')
			    .attr({	//14 - When submenus are shown, we change the aria-expanded value to true and remove keyboard access from the submeny container with the tabindex. Also update the aria-hidden value in the submenu
		            'aria-expanded': true,
		            'tabindex': -1
		        })
		    ;
			
			$submenu
		        .attr({
		            'aria-hidden': false
		        })
	        ;		
		}
	};
	
	/** 
	 * Hides submenu.
	 * 
	 * @param {object} event - Mouse event.
	 */
	Plugin.prototype.hideSubmenu = function(event) {
		
		var $elem, $submenu;
		
		$elem = $(event.currentTarget);
		$submenu = $elem.children('ul');
		
		if ($submenu.length) {
			$elem.removeClass('expanded')
				.attr({'aria-expanded': false})//15 - also update the aria-expanded tag
			;
			$submenu.attr({'aria-hidden': true});//16 - Hide submenus 
		    $submenu.children('li').attr({'tabindex': -1});//17 - remove keyboard access to hidden menu items
		}
	}
	
	/** 
	 * Collapses all submenus. Whem element is specified collapses all sumbenus inside that element.
	 * 
	 * @param {object} plugin - Reference to plugin.
	 * @param {object} [$elem] - jQuery object containing element (optional).
	 */
	Plugin.prototype.collapseAll = function(plugin, $elem) {
		
		$elem = $elem || plugin.element;
		
		/*
		 * 18 - When we collapse all
		 * This collapses all open menus. To make this accessible we want to:
		 * 1.set aria-hidden to true
		 * 2.aria-expanded set to false
		 * re-add keyboard access to that things can be opened again (tabindex = "0")
		 */
		$elem.find('[aria-hidden=false]').attr({'aria-hidden': true});
	    $elem.find('.expanded').removeClass('expanded').attr({'aria-expanded': false});
	    $elem.find('li').attr({'tabindex': -1}).eq(0).attr({'tabindex': 0});
		
	};
	
	/** 
	 * Activates menu selected menuitem.
	 * 
	 * @param {Object} event - Keyboard or mouse event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.activateMenuItem = function(event) {
		
		var plugin, $elem;
		
		event.stopPropagation();
		
		plugin = event.data.plugin;
		$elem = $(event.currentTarget);
		
		plugin.collapseAll(plugin);
	
		if ($elem.has('a').length) {
			alert('Menu item ' + $elem.find('>a').text() + ' selected');
		}
		
	};
	
	
	
	
	
	
	
	
	
	//19 - Add keyboard operability to determine actions on arrow keys / enter / space etc.....
	
	/**
	 * Selects specified tab.
	 *
	 * @param {Object} event - Keyboard event.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 * @param {object} event.data.index - Index of a tab to be selected.
	 */
	 
	 
	Plugin.prototype.onKeyDown = function (event) {
	   
	    var plugin, $elem, $current, $next, $parent, $submenu, $selected;
	   
	    plugin = event.data.plugin;
	    $elem = $(plugin.element);
	    $current = $(plugin.element).find(':focus');
	    $submenu = $current.children('ul');
	    $parentmenu = $($current.parent('ul'));
	    $parentitem = $parentmenu.parent('li');
	       
	    switch (event.keyCode) {
	       
	        case ik_utils.keys.right:
	           
	            event.preventDefault();
	           
	            if ($current.parents('ul').length == 1) {
	                $current.attr({'tabindex': -1}).next('li').attr({'tabindex': 0}).focus();
	            }
	           
	            break;
	       
	        case ik_utils.keys.left:
	           
	            event.preventDefault();
	           
	            if ($current.parents('ul').length == 1) {
	                $current.attr({'tabindex': -1}).prev('li').attr({'tabindex': 0}).focus();
	            }
	           
	            break;
	           
	        case ik_utils.keys.up:
	           
	            event.preventDefault();
	            event.stopPropagation();
	           
	            if ($current.parents('ul').length > 1) {
	                $current.attr({'tabindex': -1}).prev('li').attr({'tabindex': 0}).focus();
	            }
	           
	            break;
	       
	        case ik_utils.keys.down:
	           
	            event.preventDefault();
	            event.stopPropagation();
	           
	            if($current.parents('ul').length > 1) {
	                $current.attr({'tabindex': -1}).next('li').attr({'tabindex': 0}).focus();
	            }
	           
	            break;
	           
	        case ik_utils.keys.space:
	           
	            event.preventDefault();
	            event.stopPropagation();
	           
	            if($submenu.length) {
	                plugin.showSubmenu(event);
	                $submenu.children('li:eq(0)').attr({'tabindex': 0}).focus();
	            }
	            break;
	       
	        case ik_utils.keys.esc:
	           
	            event.stopPropagation();
	           
	            if ($parentitem.hasClass('expandable')) {
	               
	                $parentitem.removeClass('expanded').attr({
	                    'tabindex': 0,
	                    'aria-expanded': false
	                }).focus();
	                plugin.collapseAll(plugin, $parentitem);
	            }
	            break;
	       
	        case ik_utils.keys.enter:
	           
	            plugin.activateMenuItem(event);
	           
	            break;
	       
	        case ik_utils.keys.tab:
	           
	            plugin.collapseAll(plugin);
	           
	            break;
	    }
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	$.fn[pluginName] = function ( options ) {
		
		return this.each(function () {
			
			if ( !$.data(this, pluginName )) {
				$.data( this, pluginName,
				new Plugin( this, options ));
			}
			
		});
		
	}
 
})( jQuery, window, document );