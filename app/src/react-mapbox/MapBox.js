/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-16 22:19:20 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-18 01:20:47
 */

import React, { Component } from 'react';
import $ from 'jquery';
import mapboxgl from 'mapbox-gl';


class MapBox extends Component {

    constructor(props) {
        super(props);
        this.map = null;
        this.id = this.props.id;
        this.data = props.data;
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

        let [xmin, xmax, ymin, ymax] = [Infinity, -Infinity, Infinity, -Infinity];

        this.data.forEach(d => {
            xmin = Math.min(xmin, d.lng);
            xmax = Math.max(xmax, d.lng);
            ymin = Math.min(ymin, d.lat);
            ymax = Math.max(ymax, d.lat);
        });

        if (this.data.length === 0) {
            xmin = 73;
            xmax = 135;
            ymin = 3;
            ymax = 53;
        }

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
            zoom: 9
        });

        this.map.on('load', () => {
            this.loaded = true;
            $('.mapboxgl-canvas').css('position', 'relative');
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
        if (this.map && target) {
            this.map.fitBounds(target.getBounds());
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
