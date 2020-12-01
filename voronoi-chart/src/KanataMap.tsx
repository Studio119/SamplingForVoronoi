import React, { Component, RefObject } from "react";
import Color, { ColorThemes } from "./preference/Color";
import MapBox from "./react-mapbox/MapBox";
import { cellType, censusType, DataItem, datumType } from "./TypeLib";
import $ from 'jquery';
import { System } from "./System";
import * as d3 from 'd3';


export interface KanataMapProps {
    accessToken: string;
    id: string;
    width: number;
    height: number;
    before?: React.ReactNode;
    after?: React.ReactNode;
};

export interface KanataMapState<T> {
    data: {
        geoPoints: Array<{
                    lng: number;
                    lat: number;
                    projection?: number;
                    value: number;
                }>;
        features: Array<T>
    }
}

export class KanataMap<P = {}> extends Component<KanataMapProps & P, KanataMapState<censusType>, {}> {

    protected map: React.RefObject<MapBox>;

    protected canvasScatter: React.RefObject<HTMLCanvasElement>;
    protected ctxScatter: CanvasRenderingContext2D | null;
    protected canvasVoronoi: React.RefObject<HTMLCanvasElement>;
    protected ctxVoronoi: CanvasRenderingContext2D | null;
    protected bounds: [[number, number], [number, number]]
        = [[ 50.55349948549696, 22.86881607932105 ], [ -128.14621384226703, -67.85378615773539 ]];
//     protected border: [number, number][] = [
// [0.3287808771441689, 51.53597152937007],
// [0.3029328112160101, 51.5313775558262],
// [0.2770847452879366, 51.525634436900134],
// [0.26693014795904446, 51.51357152895963],
// [0.24939038893700172, 51.504953209898474],
// [0.23646635597245336, 51.49058572177731],
// [0.2226191777969575, 51.47276374625514],
// [0.21338772568000763, 51.458386111934374],
// [0.2069257091977761, 51.44285317830716],
// [0.18753965975190567, 51.43134389429895],
// [0.17738506242301355, 51.42213437904607],
// [0.16723046509417827, 51.41061987469874],
// [0.15061385128399252, 51.39852652340056],
// [0.1358435278966681, 51.384701634338285],
// [0.14138239916701423, 51.368567316962185],
// [0.14138239916701423, 51.35934515373614],
// [0.14599812522550337, 51.346085040490976],
// [0.138612963531358, 51.33512813912998],
// [0.1219963497202059, 51.32474550063475],
// [0.10353344548624932, 51.32936029687377],
// [0.08876312209889647, 51.326476103645916],
// [0.06568449180645075, 51.3201302399915]
// , [0.07491594392348588, 51.31551451492726],
// [0.08414739604040733, 51.31089832542531],
// [0.09614828379304186, 51.29877861815186],
// [0.10168715506347326, 51.28665571019357],
// [0.08876312209889647, 51.28492360490148],
// [0.07491594392348588, 51.28665571019357],
// [0.06199191095987544, 51.291274338268636],
// [0.04075957109020578, 51.28896508229772],
// [0.02598924770290978, 51.29185163411586],
// [0.006603198257010945, 51.29069703516325],
// [0.005680053045153954, 51.30224171824591],
// [0.008449488679843853, 51.31378349829117],
// [0.008449488679843853, 51.31897635226565],
// [-0.013705996400716458, 51.32359172901255],
// [-0.029399464999954716, 51.326476103645916],
// [-0.04878551444579671, 51.324168618452006],
// [-0.04416978838730756, 51.31320647823219],
// [-0.0654021282569488, 51.30974420547949],
// [-0.07001785431546637, 51.30224171824591],
// [-0.08940390376130836, 51.29531525677743],
// [-0.10786680799523651, 51.28781041076246],
// [-0.14663890688689207, 51.291274338268636],
// [-0.17710269887354002, 51.29589250181806],
// [-0.1734101180269363, 51.31320647823219],
// [-0.1835647153558284, 51.326476103645916],
// [-0.20479705522444647, 51.32359172901255],
// [-0.23987657326952672, 51.3201302399915],
// [-0.2463385897518151, 51.334551387555564],
// [-0.24079971848144055, 51.343778542075654],
// [-0.24449229932804428, 51.35300383925633],
// [-0.26664778440957093, 51.364532849054086],
// [-0.27403294610275, 51.3506976890792]
// ,[-0.2888032694900744, 51.342048592084154],
// [-0.3146513354182048, 51.32936029687377],
// [-0.33680682049973143, 51.339741890521]
// ,[-0.3331142396531561, 51.35934515373614],
// [-0.3331142396531561, 51.3726014294333]
// ,[-0.3248059327470685, 51.394494695611]
// ,[-0.3386531109225359, 51.394494695611]
// ,[-0.37280948375573075, 51.394494695611],
// [-0.3921955332025959, 51.40255799583767],
// [-0.4134278730712424, 51.414650281145384],
// [-0.4438916650578051, 51.41810463244673],
// [-0.46789344056216464, 51.42328566996014],
// [-0.4734323118325392, 51.44400394721359],
// [-0.4725091666206538, 51.45493480559344],
// [-0.4540462623866972, 51.4664381452657],
// [-0.47897118310291376, 51.46758831976899],
// [-0.5057423942429295, 51.47276374625514],
// [-0.5038961038191587, 51.488286503378845],
// [-0.49558779691406585, 51.510124396967996],
// [-0.5038961038191587, 51.525634436900134],
// [-0.5149738463599363, 51.54400986748928],
// [-0.4891257804318059, 51.55893444308859],
// [-0.4891257804318059, 51.56754254797846],
// [-0.5020498133953311, 51.5790174863958],
// [-0.5085118298776479, 51.59622446292548],
// [-0.513127555936137, 51.61858379038159],
// [-0.5168201367827123, 51.63749462101998],
// [-0.49928037776064116, 51.64150499596133],
// [-0.4835869091614029, 51.63348389141183],
// [-0.47435545704445303, 51.61973012573344],
// [-0.4632777145036755, 51.61858379038159],
// [-0.44666110069351816, 51.62660752976268],
// [-0.4152741634950132, 51.62660752976268],
// [-0.39681125926105665, 51.618010611847154],
// [-0.3820409358737038, 51.62316895804943],
// [-0.36080859600406257, 51.62832671789582],
// [-0.34788456304050897, 51.639213396565594],
// [-0.3321910944412707, 51.64551501624692],
// [-0.30818931893693957, 51.63749462101998],
// [-0.2758792365265208, 51.64551501624692],
// [-0.2555700418687934, 51.65181576017548],
// [-0.23987657326952672, 51.665559798255],
// [-0.2195673786117993, 51.66326941471152],
// [-0.20756649086013113, 51.67243025419651],
// [-0.18541100577857605, 51.68101685883735],
// [-0.14571576167500666, 51.683878698603365],[-0.14202318082843135, 51.67071273789992],[-0.12356027659447477, 51.67185775600046],[-0.11802140532410021, 51.68101685883735],[-0.10325108193674737, 51.69017410938571],[-0.08294188727901997, 51.679872072282706],[-0.05894011177468883, 51.687312667557194],[-0.003551399071824335, 51.68902955435948],[0.014911505162132244, 51.68101685883735],[0.0047569078332401205, 51.67071273789992],[0.0047569078332401205, 51.65754294928888],[0.016757795585903068, 51.64551501624692],[0.03706699024363047, 51.635775780331414],[0.05552989447758705, 51.62660752976268],[0.06845392744111223, 51.61743742607317],[0.08691683167609199, 51.61858379038159],[0.12753522099055203, 51.62488827648076],[0.14599812522550337, 51.61629103280754],[0.1589221581890854, 51.620876432128284],[0.18661651453999184, 51.62660752976268],[0.2420052272428279, 51.62889976612965],[0.2613912766886699, 51.61858379038159],[0.27431530965321826, 51.60883877073013],[0.27431530965321826, 51.59679791657621],[0.2650838575362968, 51.58991599488465],[0.2733921644413613, 51.581312126475154],[0.2909319234633756, 51.573854122582304],[0.3047791016398378, 51.56352563515313],[0.3177031346034198, 51.5577865726456],[0.3380123292611472, 51.548602566111214],[0.3287808771441689, 51.53597152937007]];
    protected border: [number, number][] = [[-87.6483584586209, 42.02701936944908],
    [-87.62923015034538, 41.97726818812856],
    [-87.61488391913842, 41.963046420260866],
    [-87.62205703474191, 41.9479323129527],
    [-87.60531976500066, 41.905237840006265],
    [-87.58499593745762, 41.89811931679216],
    [-87.59575561086287, 41.87230801788124],
    [-87.55630347504437, 41.80550630725406],
    [-87.5288065318985, 41.76628351846452],
    [-87.5108737428898, 41.724359945591544],
    [-87.50609166582124, 41.67973035129876],
    [-87.51326478142472, 41.66454923340896],
    [-87.51206926215728, 41.63775029178464],
    [-87.56108555211357, 41.621665575592004],
    [-87.6304256696122, 41.62434664031812],
    [-87.63162118887965, 41.642217556269514],
    [-87.7081344219818, 41.65740393909215],
    [-87.75715071193811, 41.66276298415855],
    [-87.7595417504724, 41.703834179365884],
    [-87.80018940555772, 41.69401519155514],
    [-87.85279225331576, 41.67615864566622],
    [-87.86952952305636, 41.69758590603652],
    [-87.79660284775596, 41.73060561686435],
    [-87.75834623120491, 41.72971341528532],
    [-87.75834623120491, 41.756474072140946],
    [-87.81931771383324, 41.759149524400385],
    [-87.81931771383324, 41.81352619427216],
    [-87.76910590461013, 41.80817971448542],
    [-87.75475967340316, 41.82778129204763],
    [-87.75475967340316, 41.850048529145965],
    [-87.78942973215248, 41.84826743530866],
    [-87.78823421288567, 41.893669836793094],
    [-87.82649082943674, 41.89633956199134],
    [-87.82170875236751, 41.922141152001984],
    [-87.94484723689166, 41.9425970663911],
    [-87.95680242956371, 42.0208025991995],
    [-87.88746231206508, 42.0208025991995],
    [-87.84561913771228, 42.00126022118215],
    [-87.83725050284197, 42.043890395904526],
    [-87.76551934680839, 42.02879547787052],
    [-87.73204480732588, 42.008367235131914],
    [-87.72008961465384, 42.03856318717456],
    [-87.64118534301744, 42.03412350539773]];
    protected cells: Array<cellType>;     
    protected tickDone: number;
    private processSVG: RefObject<SVGSVGElement>;
    private processRect: RefObject<SVGRectElement>;
    private timers: Array<NodeJS.Timeout>;
    protected colorLinear: [string, string];
    protected oriData: Array<datumType<censusType>>;
    protected labels: Array<number[]>;

    public constructor(props: KanataMapProps & P) {
        super(props);
        this.map = React.createRef<MapBox>();
        this.canvasScatter = React.createRef<HTMLCanvasElement>();
        this.ctxScatter = null;
        this.canvasVoronoi = React.createRef<HTMLCanvasElement>();
        this.ctxVoronoi = null;
        this.tickDone = 0;
        this.timers = [];
        this.processSVG = React.createRef<SVGSVGElement>();
        this.processRect = React.createRef<SVGRectElement>();
        this.cells = [];
        this.colorLinear = ['rgb(255,0,0)', 'rgb(0,255,0)'];
        this.oriData = [];
        this.labels = [];
        this.state = {
            data: {
                geoPoints: [],
                features: []
            }
        };
    }

    public render(): JSX.Element {
        return (
            <div>
                { this.props.before }
                <div key="mapbox-container" id={ this.props.id } style={{
                    display: "block",
                    width: this.props.width,
                    height: this.props.height,
                    backgroundColor: "rgb(27,27,27)",
                }} >
                    <MapBox ref={ this.map } containerID={ this.props.id }
                    accessToken={ this.props.accessToken }
                    // center={ [-0.1132, 51.4936] }
                    center={ [ -87.744, 41.891 ] }
                    zoom={ 9.2 } allowInteraction={ true }
                    styleURL="mapbox://styles/wenyari/ckhj2tcda239819lockbtroo8"
                    minZoom={ 1 } maxZoom={ 15 }
                    onBoundsChanged={ () => {
                        if(this.state.data.geoPoints.length !== 0)
                            this.repaint();
                        // this.test();
                    } } />
                </div>
                <div key="canvas-container" style={{
                    display: "block",
                    width: this.props.width,
                    height: this.props.height,
                    top: 0 - this.props.height,
                    position: "relative",
                    pointerEvents: "none"
                }} >
                    <canvas ref={ this.canvasScatter }
                    width={ this.props.width } height={ this.props.height }
                    style={{
                        position: 'relative'
                    }} />
                    <canvas ref={ this.canvasVoronoi }
                    width={ this.props.width } height={ this.props.height }
                    style={{
                        opacity: 1,
                        position: 'relative',
                        top: -5 - this.props.height
                    }} />
                </div>
            <svg key="process" id={ "process" }
                ref={ this.processSVG }
                width={ this.props.width - 2 } height="15px"
                style={{
                    position: "relative",
                    top: -this.props.height,
                    pointerEvents: "none",
                    border: '1px solid black'
                    // backgroundColor: 'rgb(50,100,180)'
            }} >
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{
                            stopColor: Color.setLightness(
                                ColorThemes.NakiriAyame.Green, 0.5
                            ),
                            stopOpacity: 1
                        }} />
                        <stop offset="90%" style={{
                            stopColor: Color.setLightness(
                                ColorThemes.NakiriAyame.Green, 0.7
                            ),
                            stopOpacity: 1
                        }} />
                        <stop offset="100%" style={{
                            stopColor: Color.setLightness(
                                ColorThemes.NakiriAyame.Green, 0.8
                            ),
                            stopOpacity: 1
                        }} />
                    </linearGradient>
                </defs>
                <rect key='pp' ref={ this.processRect } id={ "processR" }
                x={ 0 } y={ 0 } width={ 0 } height={ 15 }
                style={{
                    // stroke: 'black',
                    // strokeWidth: '1.5px',
                    fill: 'url(#grad)'
                }} />
            </svg>
                { this.props.after }
            </div>
        );
    }

    public componentDidMount(): void {
        this.ctxScatter = this.canvasScatter.current!.getContext('2d');
        this.ctxVoronoi = this.canvasVoronoi.current!.getContext('2d');
        this.ctxVoronoi!.lineWidth = 0.5;
    }

    public componentDidUpdate(): void {
        // this.test();
        if(this.state.data.geoPoints.length !== 0)
            this.repaint();
    }

    private process(): void {
        $("#processR").attr("width", 0);
        this.tickDone = 0;
        this.timers.forEach((timer: NodeJS.Timeout) => {
            clearTimeout(timer);
        });
        this.timers = [];
    }

    private makeStep(): void {
        this.tickDone += 1;
        // if (this.tickDone >= this.timers.length) {
        //     this.process();
        // } else {
        //     $("#processR").attr(
        //         "width",
        //         100 * this.tickDone / this.timers.length + "%"
        //     );
        // }
        $("#processR").attr(
            "width",
            100 * this.tickDone / this.timers.length + "%"
        );
    }

    public repaint(): void {
        this.process();
        if(System.border)
            this.ctxVoronoi!.lineWidth = 0.5;
        else
            this.ctxVoronoi!.lineWidth = 0;
        this.ctxScatter!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);
        this.ctxVoronoi!.clearRect(-2, -2, this.props.width + 4, this.props.height + 4);

        // this.d3DrawVoronoi();

        const delaunay = d3.Delaunay.from(this.state.data.geoPoints.map(d => {
            try {
                const a = this.map.current!.project([d.lng, d.lat]);
                
                return [a.x, a.y];
                
            } catch (error) {
                console.log(d)
                console.log(error)
                
                return [0, 0];
            }
        }).concat(this.border.map((d) => {
            const a = this.map.current!.project(d);
            return [a.x, a.y];
        })));
        const voronoi = delaunay.voronoi([0.5, 0.5, this.props.width - 0.5, this.props.height - 0.5]);
        let cells: Array<d3.Delaunay.Polygon> = [];
        for(let i: number = 0; i< this.state.data.geoPoints.length; i++)
            cells.push(voronoi.cellPolygon(i));

        
        let maxValue: number = -10;
        let minValue: number = 100;
        maxValue = Math.max(maxValue, ...this.state.data.geoPoints.map((d) => d.value));
        minValue = Math.min(minValue, ...this.state.data.geoPoints.map((d) => d.value));
        let sum = 0;
        this.state.data.geoPoints.forEach((d) => {
            sum += d.value;
        });
        console.log(sum / this.state.data.geoPoints.length)
        const fz:(value: number) => number = (value) => {
            return (value - minValue) / (maxValue - minValue);
        };
        console.log(maxValue, minValue)
        // let ready2: Array<Array<edgeType>> = [];
        // const step2: number = 100;
        // for(let i:number=0; i<step2; i++){
        //     ready2.push([]);
        // }
        // this.edges.forEach((d, index) => {
        //     ready2[index % step2].push(d);
        // });

        // ready2.forEach((
        //     list: Array<edgeType>,
        //     index: number
        // ) => {
        //     this.timers.push(
        //         setTimeout(() => {
        //             list.forEach((
        //                 d: edgeType
        //             ) => {
        //                 if(this.voronoi)
        //                     this.addLine(d.start, d.end, ['rgb(220, 40, 40)', 'rgb(220, 220, 220)']);
        //             });
        //             this.makeStep();
        //         }, index * 10 + step * 10)
        //     );
        // });
        
        // let maxValue: number = -1000;
        // let minValue: number = 9999;
        // this.cells.forEach(d => {
        //     maxValue = maxValue < d.value ? d.value : maxValue;
        //     minValue = minValue > d.value ? d.value : minValue;
        // });
        // const fz: (value: number) => number = (value) => {
        //     let result: number = 1 - (value - minValue) / (maxValue - minValue);
        //     return result > 0.96 ? 0.96 : result < 0.05 ? 0.05 : result;
        // };
        
        const step: number = 50;
        if(voronoi){
        if(!System.merge){
            let ready2: Array<Array<[d3.Delaunay.Polygon, number]>> = [];
            const step2: number = 100;
            for(let i:number=0; i<step2; i++){
                ready2.push([]);
            }
            cells.forEach((d, index) => {
                ready2[index % step2].push([d, index]);
            });

            ready2.forEach((
                list: Array<[d3.Delaunay.Polygon, number]>,
                index: number
            ) => {
                this.timers.push(
                    setTimeout(() => {
                        list.forEach((
                            d: [d3.Delaunay.Polygon, number]
                        ) => {
                            if(d !== null){
                                // let flag: boolean = true;
                                // const currBorder: [number, number][] = this.border.map((d) => {
                                //     const a: {x: number; y: number} = this.map.current!.project(d);
                                //     return [a.x, a.y];
                                // });
                                // for(let i: number = 0; i < d.length; i++){
                                //     if(!d3.polygonContains(currBorder, [d[i][0], d[i][1]])){
                                //         flag = false;
                                //     }
                                // }
                                if(System.voronoi)
                                    this.addCell(d[0], ['rgb(220, 220, 220)', Color.interpolate(this.colorLinear[1], this.colorLinear[0],
                                        this.state.data.geoPoints[d[1]].projection!)]);                          
                            }
                        });
                        this.makeStep();
                    }, index * 10 + step * 10)
                );
            });
        }else {
                let ready2: Array<Array<[d3.Delaunay.Polygon, number]>> = [];
                const step2: number = 100;
                for(let i:number=0; i<step2; i++){
                    ready2.push([]);
                }
                cells.forEach((d, index) => {
                    let name: number = 0;
                    for(let i: number = 0; i < this.labels.length; i++)
                        for(let j: number = 0; j < this.labels[i].length; j++)
                            if(this.labels[i][j] === index){
                                name = i;
                                break;
                            }
                    ready2[index % step2].push([d, name]);
                });
                let values: Array<number> = [];
                this.labels.forEach((d) => {
                    let sum: number = 0;
                    d.forEach((id, i) => {
                        sum += this.state.data.geoPoints[id].projection!;
                        if(i === d.length - 1){
                            values.push(sum / d.length);
                        }
                    });
                });
    
                ready2.forEach((
                    list: Array<[d3.Delaunay.Polygon, number]>,
                    index: number
                ) => {
                    this.timers.push(
                        setTimeout(() => {
                            list.forEach((
                                d: [d3.Delaunay.Polygon, number]
                            ) => {
                                if(d !== null){
                                    // let flag: boolean = true;
                                    // const currBorder: [number, number][] = this.border.map((d) => {
                                    //     const a: {x: number; y: number} = this.map.current!.project(d);
                                    //     return [a.x, a.y];
                                    // });
                                    // for(let i: number = 0; i < d.length; i++){
                                    //     if(!d3.polygonContains(currBorder, [d[i][0], d[i][1]])){
                                    //         flag = false;
                                    //     }
                                    // }
                                    if(System.voronoi){
                                        this.addCell(d[0], ['rgb(220, 220, 220)', Color.interpolate(this.colorLinear[1], this.colorLinear[0],
                                            values[d[1]])]); 
                                    }                        
                                }
                            });
                            this.makeStep();
                        }, index * 10 + step * 10)
                    );
                });
            }
        }
        let ready: Array<[number, number, number, number][]> = [];
        for(let i:number=0; i<step; i++){
            ready.push([]);
        }
        ready.push([]);
        this.state.data.geoPoints.forEach((d, index) => {
            ready[index % step].push([d.lng, d.lat, fz(d.value), d.projection!]);
        });

        ready.forEach((
            list: Array<[number, number, number, number]>,
            index: number
        ) => {
            this.timers.push(
                setTimeout(() => {
                    list.forEach((
                        d: [number, number, number, number]
                    ) => {
                        if(System.unsampled)
                            this.addPoint(d[0], d[1], [Color.interpolate(this.colorLinear[1], this.colorLinear[0], d[3]), 'rgb(50, 50, 50)']);
                    });
                    this.makeStep();
                }, index * 10)
            );
        });
    }

    private addPoint(x: number, y: number, style: [string, string]): void {
        this.ctxScatter!.fillStyle = style[0];
        this.ctxScatter!.strokeStyle = style[1];

        let point: {x: number, y: number} = this.map.current!.project([x, y]);

        // this.ctxScatter!.fillRect(point.x - 3, point.y - 3, 6, 6);
        // this.ctxScatter!.strokeRect(point.x - 3, point.y - 3, 6, 6);
        
        this.ctxScatter!.beginPath();
        this.ctxScatter!.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        this.ctxScatter!.stroke();
        this.ctxScatter!.fill();
    }

    private addLine(pointA: [number, number], pointB: [number, number], style: [string, string]): void {
        this.ctxVoronoi!.fillStyle = style[0];
        this.ctxVoronoi!.strokeStyle = style[1];

        let a: {x: number, y: number} = this.map.current!.project(pointA);
        let b: {x: number, y: number} = this.map.current!.project(pointB);

        this.ctxVoronoi!.beginPath();
        this.ctxVoronoi!.moveTo(a.x, a.y);
        this.ctxVoronoi!.lineTo(b.x, b.y);
        this.ctxVoronoi!.closePath();
        this.ctxVoronoi!.stroke();
    }

    private addCell(cell: d3.Delaunay.Polygon, style: [string, string]): void {
        this.ctxVoronoi!.fillStyle = style[1];
        this.ctxVoronoi!.strokeStyle = style[0];
        // console.log(cell)
        // console.log(style[1])
        if(cell !== null){
            this.ctxVoronoi!.beginPath();
            cell.forEach((d: d3.Delaunay.Point, index) => {
                if(index === 0)
                    this.ctxVoronoi!.moveTo(d[0], d[1]);
                else
                    this.ctxVoronoi!.lineTo(d[0], d[1]);
            });
            this.ctxVoronoi!.closePath();
            if(System.border)
                this.ctxVoronoi!.stroke();
            if(System.fill)
                this.ctxVoronoi!.fill();
        }
        // if(cell.vertices.length !== 0){
        //     this.ctxVoronoi!.beginPath();
        //     cell.vertices.forEach((d, index) => {
        //         if(index === cell.vertices.length - 1){
        //             let a: {x: number, y: number} = this.map.current!.project(d);
        //             let b: {x: number, y: number} = this.map.current!.project(cell.vertices[0]);
        //             this.ctxVoronoi!.moveTo(a.x, a.y);
        //             this.ctxVoronoi!.lineTo(b.x, b.y);
        //         }
        //         else {
        //             let a: {x: number, y: number} = this.map.current!.project(d);
        //             let b: {x: number, y: number} = this.map.current!.project(cell.vertices[index + 1]);
        //             this.ctxVoronoi!.moveTo(a.x, a.y);
        //             this.ctxVoronoi!.lineTo(b.x, b.y);
        //         }
        //     });
        //     this.ctxVoronoi!.closePath();
        //     this.ctxVoronoi!.stroke();
        // }
    }

    protected cellMerge(polygons: Array<d3.Delaunay.Polygon>): Array<d3.Delaunay.Polygon> {
        let edges: Array<[number[], number[]]> = [];
        let newPolygon: Array<d3.Delaunay.Polygon> = [];
        // console.log(polygons)
        polygons.forEach((polygon) => {
            // console.log(polygon)
            if(polygon !== null)
                polygon.forEach((p, index) => {
                    if(index !== polygon.length - 1){
                        let edge: [number[], number[]] = [p, polygon[index + 1]];
                        if (edges.indexOf(edge) === -1){
                            edges.push(edge);
                        } else {
                            edges.slice(edges.indexOf(edge), 1);
                        }
                    }
                });
        });
        // for(let i: number = 0; i< edges.length - 1; i++){

        //     let nextStart: number[] = edges[i][1];
        //     for(let j: number = i + 1; j < edges.length - 1; j++){
        //         if(edges[j][0] === nextStart){ 
        //             if(j !== i + 1 && i + 1 < edges.length){
        //                 let temp: [number[], number[]] = edges[j];
        //                 edges[j] = edges[i + 1];
        //                 edges[i + 1] = temp;
        //             }
        //         }
        //     }
        // }
        let edgeList: Array<Array<[number[], number[]]>> = [];
        let startIndex: number = 0;
        for(let i: number = 0; i < edges.length - 1; i++){
            let flag: boolean = false;
            let nextStart: number[] = edges[i][1];
            for(let j: number = i + 1; j < edges.length - 1; j++){
                if(edges[j][0] === nextStart){
                    if(i + 1 < edges.length){
                        let temp: [number[], number[]] = edges[j];
                        edges[j] = edges[i + 1];
                        edges[i + 1] = temp;
                        flag = true;
                    }
                    break;
                }
            }
            if(flag && edges[i + 1][1][0] === edges[startIndex][0][0] && edges[i + 1][1][1] === edges[startIndex][0][1]){
                // console.log(startIndex, i+1)
                let tempEdges: Array<[number[], number[]]> = [];
                for(let c: number = startIndex; c <= i + 1; c++){
                    tempEdges.push(edges[c]);
                }

                startIndex = i + 1 + 1;
                edgeList.push(tempEdges);
            }
        }
        // console.log(edges)
        console.log(edgeList)
        edgeList.forEach((pl) => {
            let tempPolygon: d3.Delaunay.Polygon = [];
            pl.forEach((d) => {
                tempPolygon.push(d[0]);
            });
            newPolygon.push(tempPolygon);
        });
        if(edgeList.length !== 0)
            for(let i: number = 0; i < newPolygon.length; i++)
                newPolygon[i].push(edgeList[i][0][0]);
        // if(edges.length !== 0)
        //     newPolygon.push(edges[0][0]);
        return newPolygon;
    }

    public load(data: Array<datumType<censusType>>): void {
        // let maxValue1 = 0;
        // maxValue1 = Math.max(maxValue1, ...data1.map((d: DataItem) => d.value));
        let maxValue: number = -1000;
        data.forEach(d => {
            maxValue = maxValue < d.features.usual ? d.features.usual : maxValue;
        });
        this.setState({
            data: {
                geoPoints: data.map((d) => {
                    return {
                        lat: d.lat,
                        lng: d.lng,
                        value: d.features.usual,
                        projection: Math.log10(1 + d.features.usual / maxValue * 9)
                    };
                }),
                features: data.map(d => d.features)
            }
        })
    }

    public loada(data: Array<DataItem>): void {
        // let maxValue1 = 0;
        // maxValue1 = Math.max(maxValue1, ...data1.map((d: DataItem) => d.value));
        let maxValue: number = -1000;
        data.forEach(d => {
            maxValue = maxValue < d.value ? d.value : maxValue;
        });
        this.setState({
            data: {
                geoPoints: data.map((d) => {
                    return {
                        lat: d.lat,
                        lng: d.lng,
                        value: d.value,
                        // projection: Math.log10(1 + d.value / maxValue * 9)
                        projection: Math.pow(d.value / maxValue, 0.2)
                    };
                }),
                features: []
            }
        })
    }

    public loadb(data: Array<{lat: number; lng: number; value: number;}>): void {
        // let maxValue1 = 0;
        // maxValue1 = Math.max(maxValue1, ...data1.map((d: DataItem) => d.value));
        let maxValue: number = -1000;
        data.forEach(d => {
            maxValue = maxValue < d.value ? d.value : maxValue;
        });
        this.setState({
            data: {
                geoPoints: data.map((d) => {
                    return {
                        lat: d.lat,
                        lng: d.lng,
                        value: d.value,
                        projection: Math.log10(1 + (d.value - 1) / (maxValue - 1) * 9)
                    };
                }),
                features: []
            }
        })
    }

    public loadCells(data: Array<cellType>) {
        let maxValue: number = -1000;
        data.forEach(d => {
            maxValue = maxValue < d.value ? d.value : maxValue;
        });
        // console.log(maxValue) 
        this.cells = data.map(d => {
            return {
                id: d.id,
                value: d.value,
                projection: Math.log10(1 + d.value / maxValue * 9),
                points: d.points
            };
        });
        // this.repaint();
        // this.forceUpdate();
    }

    public changeValue(value: string): void {
        let maxValue: number = -1000;
        
        this.oriData.forEach(d => {
            maxValue = maxValue < d.features.area ? d.features.usual : maxValue;
        });
        this.setState({
            data: {
                geoPoints: this.oriData.map((d) => {
                    return {
                        lat: d.lat,
                        lng: d.lng,
                        value: d.features.usual,
                        // projection: Math.log10(1 + d.features.usual / maxValue * 9)
                        projection: Math.log10(1 + d.features.usual / maxValue * 9)
                    };
                }),
                features: this.oriData.map(d => d.features)
            }
        })
    }

    public loadLabels(data: Array<{id: number; label: number}>): void {
        this.labels = [];
        for(let i: number = 0; i < System.params.classes; i++){   
            this.labels.push([]);
        }
        data.forEach((d) => {
            this.labels[d.label].push(d.id);
        });
        this.forceUpdate();
    }
};
