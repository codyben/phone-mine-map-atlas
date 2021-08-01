"use strict";
class MineMap {
    constructor(attributes, map, id, control) {
      this.attributes = attributes;
        this.collection = attributes.Collection;
        this.sheet = attributes['Local Sheet'];
        this.downloadURL = attributes.URL;
        this.control = control;
        this.WMSPath = attributes.geor_path;
        this.WMSName = attributes.geor_name;
        this.ok = !((this.WMSPath == "N/A") || (this.WMSName == "N/A"));
        this.map = map;
        this.layerId = id;
        if(this.ok) {
          const parts_ = this.WMSPath.replace("https://", "").split("/");
          const parts = parts_.filter(p => p != "");
          const id = parts.pop();
          parts.pop();
          parts.pop();
          const WMSUrl = this.WMSPath.replace("/rest/", "/").replace(id, "") + "WMSServer";
          this.layer = 	L.tileLayer.wms(WMSUrl, {
            layers: this.layerId,
            transparent: true,
            format: 'image/png',
            maxZoom: 20
          });
          this.layer._minemapname = this.WMSName;
          this.WMSURL = WMSUrl;
          this.layer._backref = this;
          // console.log(WMSUrl);
        }

        this.memoized = false;
    }
    addToPopup(listgroup) {
      if(!this.memoized) {
        const li = document.createElement("li");
        li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-start");
        const container = document.createElement("div");
        container.classList.add("ms-2", "me-auto");
        container.textContent = this.sheet;
        const phummis = document.createElement("a");
        phummis.text = "PHUMMIS Data";
        phummis.href = `http://www.phummis.pa.gov/Phummis/Search/SheetSearch?LocalSheetID=${this.sheet}`;
        phummis.target = "_blank";
        const name = document.createElement("div");
        name.classList.add("fw-bold");
        const add = document.createElement("span");
        add.classList.add("btn", this.ok ? "btn-primary" : "disabled", "btn-sm");
        add.textContent = this.ok ? "Add" : "N/A";
        add.addEventListener("click", () => this.addLayer());
        name.appendChild(phummis);
        container.appendChild(name);
        container.appendChild(add)
        li.appendChild(container);
        this.memoized = li;
      }
      listgroup.appendChild(this.memoized);
      
    }

    serialize() {
      console.log([this.attributes, this.layerId])
      return [this.attributes, this.layerId];
    }

    dropdown() {
      return `
      <div class="dropdown">
  <button class="btn btn-sm btn-secondary dropdown-toggle map-dropdown" type="button" id="dropdown-${this.WMSName}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
    ${this.WMSName}
  </button>
  <ul class="dropdown-menu" aria-labelledby="dropdown-${this.WMSName}">
    <li><a class="dropdown-item" href="#">Action</a></li>
    <li><a class="dropdown-item" href="#">Another action</a></li>
    <li><a class="dropdown-item" href="#">Something else here</a></li>
  </ul>
</div>` //Leaflet takes html so may as well use it here to be simple.
    }
    addToQuick() {
      `  <div class="card">
      <div class="card-header" id="headingOne">
        <h5 class="mb-0">
          <button class="btn btn-sm btn-link" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
            Collapsible Group Item #1
          </button>
        </h5>
      </div>
  
      <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
        <div class="card-body">
          Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.
        </div>
      </div>
    </div>`
    const container = document.createElement("div");
    container.classList.add("card");
    const header = document.createElement("div");
    header.classList.add("card-header");
    const h5 = document.createElement("h5");
    h5.classList.add("mb-0");
    const toggleButton = document.createElement("button");
    toggleButton.classList.add("btn", "btn-link");
    toggleButton.dataset.target = `#${this.WMSName}`;
    toggleButton.dataset.toggle = "collapse";
    toggleButton.ariaExpanded = "true";
    toggleButton.ariaControls = this.WMSName;
    toggleButton.textContent = this.WMSName;

    const controlsContainer = document.createElement("div");
    controlsContainer.classList.add("collapse", "show");
    controlsContainer.dataset.parent = "#map-accordion";
    controlsContainer.id = this.WMSName;
    const controlsBody = document.createElement("div");
    controlsBody.classList.add("card-body");
    controlsBody.textContent = "TEST";

    h5.appendChild(toggleButton);
    header.appendChild(h5);
    container.appendChild(header);

    controlsContainer.appendChild(controlsBody);
    container.appendChild(controlsContainer);

    return container.outerHTML;
    }

    addLayer(s=true) {
      this.control.addLayer(this);
      if(s) this.control.serializeToLink();
    }

    removeLayer() {
      this.control.removeLayer(this);
      this.control.serializeToLink();
    }

    opacity(val) {
      this.layer.setOpacity(val);
    }


}
class MapCtrl {
    constructor(root, reseter, center = [41.245883, -75.881826]) {

      this.layerMapP = fetch("layerMaps/layers.json").then(r => {
        if(!r.ok) {
          throw Error;
        }
        return r.json()
      })
        this.map = L.map(root).setView(center, 13);
        this.map.setMaxBounds([[40.094882, -78.945007], [42.108411, -73.67157]]);
        this.accessTokenDefault = "pk.eyJ1IjoiYmVuY29keW9za2kiLCJhIjoiY2s1c2s0Y2JmMHA2bzNrbzZ5djJ3bDdscyJ9.7MuHmoSKO5zAgY0IKChI8w";
        this.tileDefault = "satellite-v9";
        this.defaultURL = `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}`
        this.layerDefault = L.tileLayer(this.defaultURL, {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>, MineMaps &copy; of their respective owners.',
            maxZoom: 20,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: this.accessTokenDefault
        });
        this.reset = () => reseter(this);
        this.layerDefault.addTo(this.map);
        this.currentLayer = this.layerDefault;
        this.registerHandlers()
        https://api.mapbox.com/styles/v1/bencodyoski/ckr83q1y1282a17qla18bqunh/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiYmVuY29keW9za2kiLCJhIjoiY2s1c2s0Y2JmMHA2bzNrbzZ5djJ3bDdscyJ9.7MuHmoSKO5zAgY0IKChI8w
        //STATUS FLAGS
        this.mineMapActive = null;
        this.mineMapVisible = null;
        this.minePopup = null;

        this.layerGroup = L.layerGroup();
        this.layerGroup.addTo(this.map);
        const baselayerOptions = {
          "Mapbox Light Road": this.layerDefault,
          "Mapbox Outdoor Topo": L.tileLayer(this.defaultURL, {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>, MineMaps &copy; of their respective owners.',
            maxZoom: 20,
            id: 'mapbox/outdoors-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: this.accessTokenDefault
        }),
        "Mapbox Dark": L.tileLayer(this.defaultURL, {
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>, MineMaps &copy; of their respective owners.',
          maxZoom: 20,
          id: 'mapbox/dark-v10',
          tileSize: 512,
          zoomOffset: -1,
          accessToken: this.accessTokenDefault,
      }), 
      "Mapbox Light Terrain": L.tileLayer(this.defaultURL, {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>, MineMaps &copy; of their respective owners.',
        maxZoom: 20,
        id: 'bencodyoski/ckr83q1y1282a17qla18bqunh',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: this.accessTokenDefault
      }),
      "Mapbox Satellite": L.tileLayer(this.defaultURL, {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>, MineMaps &copy; of their respective owners.',
        maxZoom: 20,
        id: 'mapbox/satellite-streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: this.accessTokenDefault
      }),
      "Mapbox Blueprint": L.tileLayer(this.defaultURL, {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a> Map style creator: Amy Lee Walton, MineMaps &copy; of their respective owners.',
        maxZoom: 20,
        id: 'bencodyoski/ckr8cw2fg15ku17pfyfvt8rju',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: this.accessTokenDefault
//https://api.mapbox.com/styles/v1/bencodyoski/ckr8cw2fg15ku17pfyfvt8rju/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiYmVuY29keW9za2kiLCJhIjoiY2s1c2s0Y2JmMHA2bzNrbzZ5djJ3bDdscyJ9.7MuHmoSKO5zAgY0IKChI8w      })
        })
      }
      this.baseLayerOptions = baselayerOptions;
        this.chooser = L.control.activeLayers(baselayerOptions, null);
        this.chooser.addTo(this.map);

        this.opacityControl = false;

        L.control.locate({
          flyTo: true, 
          keepCurrentZoomLevel: true,

        }).addTo(this.map);
        this.socialControl();

    }

    serializeToLink() {
      const rekey = this.rekeyLayers(this.layerGroup.getLayers());
      const b = this.map.getBounds();
      const bounds = [b.getSouthWest(), b.getNorthEast()]
      const base = this.chooser.getActiveBaseLayer();
      this.chooser._recountLayers();
      const overlays = this.chooser._findActiveOverlayLayers() || [];
      const zoom = this.map.getZoom();
      const overlay_names = [];
      const center = this.map.getCenter();
      for(const o in overlays) {
        console.log(o, overlays, rekey)
        overlay_names.push(rekey[overlays[o].name]._backref.serialize())
      }
      const serialized = {
        center: center,
        zoom: zoom,
        bounds: bounds,
        base: base.name,
        overlays: overlay_names,
      }
      console.log(JSON.stringify(serialized));
      const b64 = btoa(JSON.stringify(serialized));
      history.pushState(b64, "Serialized Data", `?share=${b64}`)
      return b64;
    }
    async deserializeFromLink(data_) {
        const data = JSON.parse(atob(data_));
        const bounds = data.bounds;
        const baseLayer = this.baseLayerOptions[decodeURI(data.base)];
        const overlays = data.overlays;
        this.map.fitBounds(bounds);
        this.map.removeLayer(this.layerDefault);
        this.map.addLayer(baseLayer);
        const center = data.center;
        if(!overlays) {
          return;
        }
        
        for(const meta of overlays) {
          console.log(meta);
          const [attributes, id] = meta;
          new MineMap(attributes, this.map, id, this).addLayer(false);

        }
        
    }

    addMapControls() {
      // const layerControls = L.Control();
      // layerControls.setPosition("topright");
      // layerControls.addTo(this.map);
      // this.layerControl = layerControls;
    }

    socialControl() {
      L.Control.Social = L.Control.extend({
        onAdd: function(map) {
            const container = L.DomUtil.create('div');

            container.innerHTML = `<nav class="nav nav-pills flex-column flex-sm-row social-bar">
            <a class="flex-sm-fill text-sm-center nav-link prev map-share" aria-current="page" >Share</a>
            <a class="flex-sm-fill text-sm-center nav-link prev map-clear">Original Map</a>
            <a class="flex-sm-fill text-sm-center nav-link prev map-reset">Reset Map</a>
            <a class="flex-sm-fill text-sm-center nav-link prev" href="#">About</a>
          </nav>`
    
            return container;
        },
    
        onRemove: function(map) {
            // Nothing to do here
        }
    });
    
    L.control.social = function(opts) {
        return new L.Control.Social(opts);
    }
    
    L.control.social({ position: 'bottomleft' }).addTo(this.map);
    const pd = document.getElementsByClassName("prev");
    for(const p of pd) {
      p.onclick = (e) => e.stopPropagation();
    }
    const shares = document.getElementsByClassName("map-share");
    for(const share of shares) {
      share.onclick = (e) => {
        e.stopPropagation();
        this.serializeToLink();
      };
    }

      const clears = document.getElementsByClassName("map-clear");
      for(const clear of clears) {
        clear.onclick = (e) => {
          e.stopPropagation();
          this.reset();
        };
      }

      const resets = document.getElementsByClassName("map-reset");
      for(const reset of resets) {
        reset.onclick = (e) => {
          e.stopPropagation();
          const url = new URL(window.location.href);
          history.pushState({}, "Home", `${url.origin}${url.pathname}`);
          this.reset();
        };
      }
    }


    // reset() {

    //   history.pushState({}, "Home", "/");
    //   this.layerGroup.clearLayers();
    //   this.map.removeControl(this.opacityControl);
    //   this.opacityControl = L.control
    //   .opacity([], {
    //       position: 'topright',
    //       collapsed: true,
    //   })
    //   this.map.removeControl(this.chooser);
    //   this.chooser = L.control.activeLayers(this.baselayerOptions, null);
    //   this.chooser.addTo(this.map);
    // }

    registerHandlers() {
      this.map.on('click', (e) => this.locationOnClick(e));
      this.map.on('locationfound', (e) => this.locationOnRequest(e));
    }

    addLayerControl() {

    }

    rekeyLayers(layers) {
      const rekeyed = {};
      for(const i in layers) {
        rekeyed[layers[i]._minemapname] = layers[i]
      }
      return rekeyed;
    }

    addLayer(layer) {
      this.layerGroup.addLayer(layer.layer);
      this.chooser.addOverlay(layer.layer, layer.WMSName);
      const rekey = this.rekeyLayers(this.layerGroup.getLayers());
      if(!this.opacityControl) {
        this.opacityControl = L.control
        .opacity(rekey, {
            position: 'topright',
            collapsed: true,
        })

      } else {
        this.map.removeControl(this.opacityControl);
        this.opacityControl = L.control
        .opacity(rekey, {
            position: 'topright',
            collapsed: true,
        })
        
      }
      this.opacityControl.addTo(this.map);
      this.opacityControl.getContainer().classList.add("opacity-control");
    }

    removeLayer(layer) {
      this.layerGroup.removeLayer(layer.layer);
    }

    clearMapModal() {
      const body = document.querySelector("#map-chooser .modal-body .list-group");
      while (body.firstChild) body.removeChild(body.firstChild);
    }

    replaceLayer(MapLayer) {}

    removeMineMap() {
      this.layerGroup.clearLayers();
    }

    toggleMineMap(opacity) {}

    async *getMapsAtLocation(y,x, nearby=false) {
        let data;
        const map = this.map;
        console.log(x,y)
        const [xmin, ymin, xmax, ymax] = map.getBounds().toBBoxString().split(",")
        if(nearby) {
          data = {
            "f":"json",
            "geometry": `{ \"xmin\": ${xmin}, \"ymin\": ${ymin}, \"xmax\": ${xmax}, \"ymax\": ${ymax}, \"spatialReference\": { \"wkid\": 4326 } }`,
             "tolerance": 3,
             "returnGeometry": true, 
             "mapExtent": "{\"xmin\":-8485754.1912479,\"ymin\":5019269.494630702,\"xmax\":-8457625.364838991,\"ymax\":5052710.694505421,\"spatialReference\":{\"wkid\":102100}}",
             "imageDisplay": "400,400,96",
             "geometryType": "esriGeometryEnvelope",
             "sr": 102100,
             "layers": "all:2,3"
        
          }
        } else {
          data = {
            "f":"json",
            "geometry": `{"x":${x},"y":${y},"spatialReference":{"wkid":4326}}`,
             "tolerance": 3,
             "returnGeometry": true, 
             "mapExtent": "{\"xmin\":-8485754.1912479,\"ymin\":5019269.494630702,\"xmax\":-8457625.364838991,\"ymax\":5052710.694505421,\"spatialReference\":{\"wkid\":102100}}",
             "imageDisplay": "400,400,96",
             "geometryType": "esriGeometryPoint",
             "sr": 102100,
             "layers": "all:2,3"
        
          }
        }
      
        const url = "https://apps.pasda.psu.edu/arcgis/rest/services/MineMaps/MapServer/identify";
        const u = new URL(url);
        u.search  = new URLSearchParams(data).toString()
        const response = await fetch(u)
        .then(r => {
          if(r.ok) {
            return r.json()
          } else {
            throw Error;
          }
        });
        this.layerMap = await this.layerMapP;
        for(const result of response.results) {
          const lid = this.layerMap[result.attributes.geor_name];
            yield new MineMap(result.attributes, this.map, lid, this);
        }
      }


      async locationOnClick(e) {
        const popup = L.popup();
        const [lat, lng] = [e.latlng.lat, e.latlng.lng];
        const results = this.getMapsAtLocation(lat, lng);
        popup.setLatLng(e.latlng);
        popup.setContent(`<div class="spinner-grow text-secondary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>`);
        popup.addTo(this.map);
        const container = document.createElement("div");
        container.classList.add("scrollable");
        // container.textContent = `${lat}°, ${lng}°`
        container.innerHTML = `<nav class="navbar navbar-light bg-light">
        <form class="form-inline">
          <input id="mine-map-search" class="form-control mr-sm-2" type="search" placeholder="Search By Name" aria-label="Search">
        </form>
      </nav>`;
        const lg = document.createElement("ol");
        lg.classList.add("list-group", "map-listing");
        lg.id = "mine-map-listing";
        this.mapsFound = [];
        for await(const r of results) {
          const resolved = await r;
          this.mapsFound.push(resolved);
          resolved.addToPopup(lg);
        }
        container.appendChild(lg);
        const advancedModal = document.createElement("div");
        advancedModal.textContent = `${lat}°, ${lng}°`;
        advancedModal.id = "coordinates";
        container.appendChild(advancedModal);
        popup.setContent(container);
        const searchHandler = (e) => this.filterMaps(e.target.value);
        const search = document.getElementById("mine-map-search");
        //https://stackoverflow.com/questions/574941/best-way-to-track-onchange-as-you-type-in-input-type-text
        search.onkeypress = search.onpaste = search.oninput = searchHandler;
      }

      filterMaps(term) {
        const lg = document.getElementById("mine-map-listing");
        if(this.mapsFound && term) {

          console.log("begin")
          const results = this.mapsFound.filter(((map) => map.sheet.includes(term)));
          console.log("end")
          while (lg.firstChild) lg.removeChild(lg.firstChild);
          if(results) {

            for(const map of results) {
              map.addToPopup(lg);
            }
          } else {
            lg.textContent = `No results for term: ${term}`;
          }
        } else {
          while (lg.firstChild) lg.removeChild(lg.firstChild);
          for(const map of this.mapsFound) {
            map.addToPopup(lg);
          }
        }
      }
  
      locationOnRequest(e) {
        const [lat, lng] = [e.latlng.lat, e.latlng.lng];
        const results = this.getMapsAtLocation(lat, lng)
        this.map.flyTo(e.latlng, this.map.getZoom())
      }
}