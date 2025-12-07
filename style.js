html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: Arial, sans-serif;
}

#header {
  background: #2c3e50;
  color: white;
  padding: 12px;
  font-size: 20px;
  text-align: center;
  font-weight: bold;
}

#main {
  display: flex;
  height: calc(100vh - 52px);
}

/* SIDEBAR */
#sidebar {
  width: 260px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  padding: 10px;
  overflow-y: auto;
  transition: 0.3s ease;
}

#sidebar.collapsed {
  width: 28px;
}

#sidebarHeader {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
}

.arrow {
  cursor: pointer;
  font-size: 20px;
}

#sidebar.collapsed span:first-child {
  display: none;
}

#sidebar.collapsed .section {
  display: none;
}

.section h3 {
  margin: 8px 0;
  font-size: 14px;
}

.section ul {
  padding: 0;
  list-style: none;
}

.section li {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 6px;
  margin-bottom: 4px;
  cursor: pointer;
}

.section li:hover {
  background: #e9f3ff;
}

li.active {
  border-color: #3498db;
  background: #e0f0ff;
}

/* MAP */
#map {
  flex: 1;
}

/* DETAIL PANEL */
#detailPanel {
  width: 300px;
  background: white;
  padding: 10px;
  border-left: 1px solid #ddd;
  position: relative;
  transform: translateX(100%);
  transition: 0.3s ease;
}

#detailPanel.show {
  transform: translateX(0);
}

#detailHeader {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
}

#detailClose {
  cursor: pointer;
  font-size: 18px;
}

input {
  width: 100%;
  padding: 6px;
  margin-bottom: 8px;
  border: 1px solid #ccc;
}

.btnRow {
  display: flex;
  gap: 5px;
}

.btn {
  padding: 6px;
  border-radius: 5px;
  cursor: pointer;
  border: none;
}

.cancel { background: #e74c3c; color: white; }
.submit { background: #3498db; color: white; }

/* LEGEND */
.legend {
  background: white;
  padding: 8px;
  border-radius: 6px;
  font-size: 11px;
  box-shadow: 0 0 6px rgba(0,0,0,0.3);
}
.legend i {
  width: 14px;
  height: 14px;
  float: left;
  margin-right: 4px;
}
