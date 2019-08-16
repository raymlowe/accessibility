;(function ( $, window, document, undefined ) {
 
	var pluginName = 'ik_treemenu',
		defaults = {//1 - add instructions
			'instructions': 'Use up or down arrows to move through menu items, and Enter or Spacebar to toggle submenus open and closed.',
			'menuTitle': 'Breakfast Menu',
			'expandAll': true
		};
	 
	/**
	 * @constructs Plugin
	 * @param {Object} element - Current DOM element from selected collection.
	 * @param {Object} [options] - Configuration options.
	 * @param {number} [options.menuTitle] - Menu title appers above the tree.
	 * @param {number} [options.expandAll] - Expands all tree branches when true.
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
		$elem = plugin.element;
		id = 'tree' + $('.ik_treemenu').length; // create unique id
				
		$elem
		.addClass('ik_treemenu')
		.attr({//2 - make menu bar selectable and read instructions upon entry
	        'tabindex': 0,
	        'aria-labelledby': id + '_instructions'
        })
		;
		
		$('<div/>') // add div element to be used with aria-labelledby attribute of the menu
			.text(plugin.options.instructions) // get instruction text from plugin options
			.addClass('ik_readersonly') // hide element from visual display
			.attr({
				'id': id + '_instructions',
				'aria-hidden': 'true'  // 3 - hide element from screen readers to prevent it from being read twice
			})
			.appendTo($elem);
		
		$('<div/>') // add menu title
			.addClass('title')
			.text( this.options.menuTitle )
			.attr({ 
				'id': id + '_title'
			})
			.prependTo($elem);
		
		$elem 
			.find('ul:first')  // set topmost ul element as a tree container
			.attr({
				'id': id,
				'role': 'tree', // 4 - assign tree role
		        'aria-labelledby': id + '_title' // 5 - label with tree title
			});
		
		$elem // set all li elements as tree folders and items
			.find('li')
			.css({ 'list-style': 'none' })
			.each(function(i, el) {
				
				var $me;
				
				$me = $(el);
				
				$me.attr({
					'id': id + '_menuitem_' + i,
					'role': 'treeitem', // 6 - <li> menu items assigned treeitem role
					    'tabindex': -1, // 7 - remove keyboard access / remove from tab order
					    'aria-level': $me.parents('ul').length, // 8 - add tree level
					    'aria-setsize': $me.siblings().length + 1, // 9 - define number of treeitems on the current level
					    'aria-posinset': $me.parent().children().index($me) + 1 // 10 -  define position of the current element on the current level
					});
				
				$($me.contents()[0]).wrap('<span></span>'); // wrap text element of each treitem with span element
				
				if ($me.children('ul').length) {  // if the current treeitem has submenu
					
					if (plugin.options.expandAll) { // expand or collapse all tree levels based on configuration
						$me.attr({
			                'aria-expanded': true // 11 - if there is a <ul> submenu, expand this item as well
			            })
			            ;
					} else {
						$me
						.attr({
				            'aria-expanded': false	// 12 - if item is no longer selected, also collapse <ul> submenu
				        }) 
						.addClass('collapsed');
					}
					
					$me
						.attr({
					        'aria-label': $me.children('span:first').text(), // 13 - Label each menuy element with its content
					    })
						.children('span')
						.addClass('folder')
						.attr({
							'role': 'presentation'// 14 - ! to ensure that the label and the content aren't both read, we assign a role of 'presentation' to the actual content - hacks!
						})
            ;
					
				} else {
					
					$me.attr({'aria-selected': false}); // 15 - If menu item has no child <ul> simply set aria-selected
					
				}
			
			})
			.on('click', {'plugin': plugin}, plugin.onClick)
			.on('keydown', {'plugin': plugin}, plugin.onKeyDown);	// 16 - Add keydown functionality
		
			// 17 - to get things started, make the first element selectable
			$elem // make the first treeitem focusable
		    .find('li:first')
		    .attr({
		        'tabindex': 0
		    });
		
	};
	
	/** 
	 * Selects treeitem.
	 * 
	 * @param {object} $item - jQuery object containing treeitem to select.
	 * @param {object} plugin - reference to plugin.
	 */
	Plugin.prototype.selectItem = function($item, plugin) {
		var $elem = plugin.element;
		
		
		// 18 - Remove focus from previously selected item
        $elem.find('[aria-selected=true]') // remove previous selection
        .attr({
            'tabindex': -1,
            'aria-selected': false
        });
        
        
        
		
		$elem.find('.focused') // remove highlight form previousely selected treeitem
			.removeClass('focused');
		
		
        $elem.find('li').attr({ // 19 - remove all treeitems from tab order
            'tabindex': -1
        })
        
        // 20 - Current item is selected. Define aria tags:
        $item.attr({ // select specified treeitem
            'tabindex': 0, // add selected treeitem to tab order
            'aria-selected': true
        });
        
		
		
		if ($item.children('ul').length) { // highlight selected treeitem
			$item.children('span').addClass('focused');
		} else {
			$item.addClass('focused');
		}
		
		$item.focus();
	};
	
	/** 
	 * Toggles submenu.
	 * 
	 * @param {object} $item - jQuery object containing treeitem with submenu.
	 */
	Plugin.prototype.toggleSubmenu = function($item) {
		
		if($item.children('ul').length) { // check if the treeitem contains submenu
			
			if ($item.hasClass('collapsed')) {  // expand if collapsed
      
				$item
		        	.attr({// 21 - set aria-expanded tag
                    	'aria-expanded': true
		        	})
					.removeClass('collapsed');
        
			} else { 							// otherwise collapse
      
				$item
			       .attr({// 22 - set aria-expanded tag
		                'aria-expanded': false
		            })
					.addClass('collapsed');
        
			}
      
		}
	}
	
	/** 
	 * Handles mouseover event on header button.
	 * 
	 * @param {Object} event - Event object.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onMouseOver = function (event) {
		
		var plugin = event.data.plugin,
			$me = $(event.currentTarget);
		
		event.stopPropagation();
		
		plugin.element // remove highlight form previous treeitem
			.find('.mouseover')
			.removeClass('mouseover');
		
		$me.children('span') // add highlight to currently selected treeitem
			.addClass('mouseover'); 
		
	}
	
	/** 
	 * Handles click event on header button.
	 * 
	 * @param {Object} event - Event object.
	 * @param {object} event.data - Event data.
	 * @param {object} event.data.plugin - Reference to plugin.
	 */
	Plugin.prototype.onClick = function (event) {
		
		var plugin = event.data.plugin,
			$me = $(event.currentTarget);
		
		event.preventDefault();
		event.stopPropagation();
		
		plugin.toggleSubmenu($me);
		plugin.selectItem($me, plugin);
	};
	
	
	
	
	//!!!!! In this example the menu is not tab navigable, we want the user to use arrow keys only.
	
	
	/**
     * Handles keydown event on header button.
     *
     * @param {Object} event - Event object.
     * @param {object} event.data - Event data.
     * @param {object} event.data.plugin - Reference to plugin.
     */
   
    Plugin.prototype.onKeyDown = function (event) {
       
        var plugin, $elem, $me, $visibleitems, curindex, newindex;
       
        plugin = event.data.plugin;
        $elem = plugin.element;
        $me = $(event.currentTarget);
       
        switch (event.keyCode) {
            case ik_utils.keys.down:
                event.preventDefault();
                event.stopPropagation();
               
                $visibleitems = $elem.find('[role=treeitem]:visible');
                newindex = $visibleitems.index($me) + 1;
               
                if (newindex < $visibleitems.length) {
                    plugin.selectItem( $($visibleitems[newindex]), plugin );
                }
                break;
            case ik_utils.keys.up:
                event.preventDefault();
                event.stopPropagation();
               
                $visibleitems = $elem.find('[role=treeitem]:visible');
                newindex = $visibleitems.index($me) - 1;
               
                if (newindex > -1) {
                    plugin.selectItem( $($visibleitems[newindex]), plugin );
                }
                break;
            case ik_utils.keys.right:
                event.preventDefault();
                event.stopPropagation();
               
                if($me.attr('aria-expanded') == 'false') {
                    plugin.toggleSubmenu($me);
                }
                break;
            case ik_utils.keys.left:
                event.preventDefault();
                event.stopPropagation();
               
                if($me.attr('aria-expanded') == 'true') {
                    plugin.toggleSubmenu($me);
                }
                break;
            case ik_utils.keys.enter:
            case ik_utils.keys.space:
                event.preventDefault();
                event.stopPropagation();
               
                plugin.toggleSubmenu($me);
               
                return false;
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