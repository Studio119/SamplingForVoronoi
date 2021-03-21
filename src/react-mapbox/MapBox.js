/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:19:20 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-21 19:39:50
 */

import React, { Component } from 'react';
import $ from 'jquery';
import mapboxgl from 'mapbox-gl';


class MapBox extends Component {

    constructor(props) {
        super(props);
        this.map = null;
        this.id = this.props.id;
        this.loaded = false;
        this.width = 0;
        this.height = 0;
    }

    render() {
        return (
            <></>
        );
    }

    componentDidMount() {
        mapboxgl.accessToken = "pk.eyJ1IjoiaWNoZW4tYW50b2luZSIsImEiOiJjazF5bDh5eWUwZ2tiM2NsaXQ3bnFvNGJ1In0.sFDwirFIqR4UEjFQoKB8uA";

        const [xmin, xmax, ymin, ymax] = [73, 135, 3, 53];

        this.map = new mapboxgl.Map({
            attributionControl: false,
            bearing: 0,
            center: [
                (xmax + xmin) / 2,
                (ymax + ymin) / 2
            ],
            container: this.id,
            dragRotate: false,
            interactive: true,
            maxBounds: this.props.bounds,
            maxZoom: 17,
            minZoom: 1,
            pitch: 0,
            pitchWithRotate: false,
            refreshExpiredTiles: false,
            style: 'mapbox://styles/mapbox/streets-v10',
            zoom: 6.5
        });

        this.map.on('load', () => {
            this.loaded = true;
            $('.mapboxgl-canvas').css('position', 'relative');
            $('.mapboxgl-canvas').css('opacity', '0.2');
            this.props.onBoundsChanged([
                [this.map.getBounds().getNorth(), this.map.getBounds().getSouth()],
                [this.map.getBounds().getWest(), this.map.getBounds().getEast()]
            ]);
            
            this.map.on('zoomend', () => {
                this.props.onBoundsChanged([
                    [this.map.getBounds().getNorth(), this.map.getBounds().getSouth()],
                    [this.map.getBounds().getWest(), this.map.getBounds().getEast()]
                ]);
            }).on('dragend', () => {
                this.props.onBoundsChanged([
                    [this.map.getBounds().getNorth(), this.map.getBounds().getSouth()],
                    [this.map.getBounds().getWest(), this.map.getBounds().getEast()]
                ]);
            });
        });
    }

    getBounds() {
        return this.map.getBounds();
    }

    fitBounds(target) {
        if (this.map) {
            this.map.fitBounds(target);
        }
    }

    getZoom() {
        return this.map ? this.map.getZoom() : -1;
    }

    ready() {
        return this.map ? this.map.loaded() : false;
    }

    project(coord) {
        if (this.map.loaded()) {
            return this.map.project(coord);
        } else {
            return {
                x: NaN,
                y: NaN
            };
        }
    }
}


export default MapBox;
