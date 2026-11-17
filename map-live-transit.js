/* Opt-in public vehicle positions. No location or account data is sent. */
(() => {
  const toolbar = document.querySelector('body:not(.preview) .map-side > .toolbar');
  if (!toolbar) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'LA Metro live';
  button.setAttribute('aria-pressed', 'false');
  const status = document.createElement('p');
  status.className = 'map-transit-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  toolbar.append(button);
  toolbar.after(status);

  const feeds = [['LACMTA','Bus'], ['LACMTA_Rail','Rail']];
  const markers = new Map();
  let sockets = [], layer, timer, connectionTimer, received = false;
  const freshness = 3 * 60 * 1000;

  function stop() {
    for (const socket of sockets) socket.close();
    sockets = [];
    clearInterval(timer);
    clearTimeout(connectionTimer);
    layer?.remove();
    markers.clear();
    status.hidden = true;
    button.setAttribute('aria-pressed', 'false');
  }

  function update() {
    for (const [key, row] of markers) {
      if (Date.now() - row.updated <= freshness) continue;
      layer.removeLayer(row.marker);
      markers.delete(key);
    }
    const count = markers.size;
    status.textContent = count
      ? count + ' LA Metro vehicles on the map · Source: LA Metro'
      : 'No current LA Metro positions received. Check again shortly.';
  }

  function start() {
    const bridge = window.BigLWAMapBridge;
    if (!bridge?.map || !window.WebSocket) {
      status.hidden = false;
      status.textContent = 'Live transit is unavailable in this view.';
      return;
    }
    const { map, L } = bridge;
    status.hidden = false;
    received = false;
    status.textContent = 'Connecting to LA Metro vehicle positions…';
    button.setAttribute('aria-pressed', 'true');
    layer = L.layerGroup().addTo(map);
    const coverage = L.latLngBounds([33.65,-118.85], [34.45,-117.55]);
    if (!coverage.contains(map.getCenter()) || map.getZoom()<9) map.setView([34.05,-118.24],10);

    for (const [agency, label] of feeds) {
      const socket = new WebSocket('wss://api.metro.net/ws/' + agency + '/vehicle_positions');
      sockets.push(socket);
      socket.addEventListener('message', event => {
        if (!sockets.includes(socket)) return;
        let response;
        try { response = JSON.parse(event.data); } catch { return; }
        const vehicle = response?.vehicle;
        const id = String(response?.id ?? vehicle?.vehicle?.id ?? '').trim();
        const { latitude, longitude } = vehicle?.position || {};
        if (!id || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
            !coverage.contains([latitude,longitude])) return;
        const timestamp = Number(vehicle.timestamp ?? response.timestamp);
        const updated = timestamp > 0 ? timestamp * 1000 : Date.now();
        if (Math.abs(Date.now()-updated) > freshness) return;
        const key = agency + ':' + id;
        const existing = markers.get(key);
        if (existing && existing.updated > updated) return;
        const marker = existing?.marker || L.circleMarker([latitude,longitude], {
          radius: label === 'Rail' ? 7 : 5, color:'#ffffff',
          fillColor:label === 'Rail' ? '#873c9a' : '#166d53', fillOpacity:1, weight:2
        }).addTo(layer);
        marker.setLatLng([latitude,longitude]);
        const description = document.createElement('span');
        const route = String(response.route_code ?? vehicle.trip?.routeId ?? vehicle.trip?.route_id ?? '').slice(0,24);
        description.textContent = 'LA Metro ' + label + (route ? ' · ' + route : '');
        if (existing) marker.setTooltipContent(description);
        else marker.bindTooltip(description);
        markers.set(key,{marker,updated});
        if (!received) { received = true; update(); }
      });
    }
    connectionTimer = setTimeout(update,10000);
    timer = setInterval(update,15000);
  }

  button.addEventListener('click', () => sockets.length ? stop() : start());
  window.addEventListener('pagehide', stop);
})();
