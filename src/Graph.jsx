import Cytoscape from 'cytoscape';
import CyDomNode from 'cytoscape-dom-node';
import lodash from 'lodash';
import { PropTypes } from 'prop-types';
import React, {
    forwardRef,
    useEffect, useImperativeHandle, useRef, useState,
} from 'react';

Cytoscape.use(CyDomNode);

/**
 * Cytoscape graph React component.
 *
 * @component
 * @returns {React.ReactElement} component
 */
function Graph({
    cyParams, layoutParams, layoutDebounce, children,
}, ref) {
    const domRef = useRef(null);
    const cytoscapeRef = useRef(null);
    const layoutRef = useRef(null);

    function runLayout() {
        if (layoutRef.current !== null) {
            layoutRef.current.stop();
        }
        layoutRef.current = cytoscapeRef.current.layout(layoutParams);

        cytoscapeRef.current.ready(function () {
            cytoscapeRef.current.fit()
            cytoscapeRef.current.center()
        })
        layoutRef.current.run();
    }

    const debouncedRunLayout = lodash.debounce(runLayout, layoutDebounce);

    useImperativeHandle(ref, () => ({
        cyRef: cytoscapeRef,
        domRef: domRef,
    }))

    useEffect(() => {
        const augmentedCyParams = {
            container: domRef.current,
            style: [{
                selector: 'node',
                style: { 'background-opacity': 0, shape: 'rectangle' },
            }],
            ...cyParams,
        };

        const cy = Cytoscape(augmentedCyParams);
        cy.domNode({ dom_container: domRef.current.querySelector('.cytoscape-react-nodes-and-edges') });
        cytoscapeRef.current = cy;
    }, []);

    useEffect(() => {
        debouncedRunLayout();
    }, [children]);

    let nodesAndEdges = [];
    if (cytoscapeRef.current !== null) {
        nodesAndEdges = React.Children.map(children, (c) => React.cloneElement(c, {
            cytoInstance: cytoscapeRef.current,
        }));
    }

    return (
        <div ref={domRef} className="cytoscape-react-cy-container">
            <div className="cytoscape-react-nodes-and-edges">
                {nodesAndEdges}
            </div>
        </div>
    );
}

Graph = forwardRef(Graph)

Graph.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    layoutParams: PropTypes.shape({}),
    cyParams: PropTypes.shape({}),
    layoutDebounce: PropTypes.number,
};

Graph.defaultProps = {
    cyParams: {},
    layoutParams: {},
    layoutDebounce: 100,
};

export default Graph;
