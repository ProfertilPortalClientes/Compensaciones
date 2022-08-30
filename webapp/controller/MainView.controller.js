sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/PDFViewer",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Locale",
    "sap/ui/core/format/DateFormat"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator, Fragment, MessageBox, PDFViewer, JSONModel, Locale, DateFormat) {
        "use strict";

        var fechaActual,
            fechaAc,
            fecha3meses,
            fecha3m;

        return Controller.extend("profertil.compensacionesv2.controller.MainView", {


            onInit: function () {
                this._pdfViewer = new PDFViewer();
                this.getView().addDependent(this._pdfViewer);
                //   var oFilter = this.getView().byId("filterbar"),
                //   that = this;


                // oFilter.addEventDelegate({
                //   "onAfterRendering": function (oEvent) {
                //     var oResourceBundle = that.getOwnerComponent().getModel("i18n").getResourceBundle();
                //     var oButton = oEvent.srcControl._oSearchButton;
                //     oButton.setText(oResourceBundle.getText("Buscar Compensaciones"));
                //   }
                // });

                //Variables locales
                var oModelFecAct = new JSONModel(),
                    fecha3meses = new Date(),
                    fechaActual = new Date();
                fechaAc = {
                    fechaActual: fechaActual.getDate() + "/" + (fechaActual.getMonth() + 1) + "/" + fechaActual.getFullYear()
                },
                    fecha3m = {
                        fecha3meses: fecha3meses.getDate() + "/" + (fecha3meses.getMonth() - 2) + "/" + fecha3meses.getFullYear()
                    };

                var oDateFormatter = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "d/M/yyyy", strictParsing: true });

                var ofecha = oDateFormatter.parse(fecha3m.fecha3meses)

                //Determino si es una fecha válida
                if (ofecha == null) {

                    var fecha = fechaActual;
                    var hoy = new Date(fecha)
                    var fechaAux = new Date(fecha)
                    fechaAux.setDate(1)
                    // Cargo 2 meses atras 
                    fechaAux.setMonth(hoy.getMonth() - 2)
                    //Busco el ultimo dia anterior asi encuentro ultimo dia del 3er mes
                    var fechaAux2 = fechaAux;
                    fechaAux2.setDate(0)
                    fecha3meses = new Date(hoy.getFullYear() + "-" + (fechaAux.getMonth() + 1) + "-" + (fechaAux2.getDate() > hoy.getDate() ? hoy.getDate() : fechaAux2.getDate()) + " 18:00:00")

                    fecha3m.fecha3meses = fecha3meses.getDate() + "/" + (fecha3meses.getMonth() + 1) + "/" + fecha3meses.getFullYear();
                }

                this.byId("FechaDesdeID").setValue(fecha3m.fecha3meses);
                this.byId("FechaHastaID").setValue(fechaAc.fechaActual);

                this.setInitialSortOrder();

            },

            onPdfDocumento: function (oEvent) {
                var oTabla = oEvent.getSource().getBindingContext().getObject();
                var ruta = this.getView().getModel().sServiceUrl;
                // eslint-disable-next-line camelcase            

                var oOriginalDate = new Date(this._setLocalTimeZoneZone(this.getOriginalDateTime(new Date(oTabla.Fecha))));

                var lv_fecha = this.formatearFecha(oOriginalDate);

                var lv_path = ruta + "/PdfSet('" + oTabla.IDComp + lv_fecha + oTabla.Kunnr + oTabla.Documento + "')/$value";
                // window.open(lv_path);

                this._pdfViewer.setSource(lv_path);
                this._pdfViewer.setTitle("Compensacion");
                this._pdfViewer.setShowDownloadButton(false);
                this._pdfViewer.open();

            },

            onBeforeRebindTable: function (oEvent) {
                var oBindingParams = oEvent.getParameter("bindingParams");
                var movDesde = this.getView().byId("FechaDesdeID");
                var movHasta = this.getView().byId("FechaHastaID");
                var fechaMovDesde = movDesde.getDateValue();
                var fechaMovHasta = movHasta.getDateValue();

                if (fechaMovDesde || fechaMovHasta) {
                    if (fechaMovDesde == null) {
                        var fechaAuxSplit = fecha3m.fecha3meses.split("/");
                        var ultima = fechaAuxSplit[1] + "/" + fechaAuxSplit[0] + "/" + fechaAuxSplit[2];
                        fechaMovDesde = new Date(ultima);

                    }

                    if (fechaMovHasta == null) {

                        var fechaAuxSplit = fechaAc.fechaActual.split("/");
                        var ultima = fechaAuxSplit[1] + "/" + fechaAuxSplit[0] + "/" + fechaAuxSplit[2];
                        fechaMovHasta = new Date(ultima);

                    }
                    oBindingParams.filters.push(new Filter("FechaDesde", FilterOperator.EQ, fechaMovDesde));
                    oBindingParams.filters.push(new Filter("FechaHasta", FilterOperator.EQ, fechaMovHasta));
                }
                /*else if (fechaMovDesde == null || fechaMovHasta == null) {
                    //movDesde.setValue("");
                    //movHasta.setValue("");
                    //MessageToast.show("Fecha desde o Fecha hasta tienen que estar completos para buscar.");
                    return;
                } */
            },

            onChangeDesde: function () {
                var fechaMovDesde = this.getView().byId("FechaDesdeID");
                var fechaMovHasta = this.getView().byId("FechaHastaID");
                var movDesde = fechaMovDesde.getDateValue();
                var movHasta = fechaMovHasta.getDateValue();

                if (movHasta == null) {
                    movHasta = new Date();
                }

                if (movDesde > movHasta && movHasta != null) {
                    fechaMovDesde.setValue("");
                    MessageBox.show("La fecha desde no puede ser mayor a la fecha hasta.");
                }
            },
            onChangeHasta: function () {
                var fechaMovDesde = this.getView().byId("FechaDesdeID");
                var fechaMovHasta = this.getView().byId("FechaHastaID");
                var movDesde = fechaMovDesde.getDateValue();
                var movHasta = fechaMovHasta.getDateValue();
                if (movDesde > movHasta && movDesde != null) {
                    fechaMovHasta.setValue("");
                    MessageBox.show("La fecha hasta no puede ser menor a la fecha desde.");
                }
            },

            setInitialSortOrder: function () {
                var oSmartTable = this.getView().byId("ListaSetID");
                oSmartTable.applyVariant({
                    sort: {
                        sortItems: [{
                            columnKey: "Fecha",
                            operation: "Descending",
                            columnKey: "Documento",
                            operation: "Descending",
                        }

                        ]
                    }
                });
            },

            padTo2Digits: function (num) {
                return num.toString().padStart(2, '0');
            },

            formatearFecha: function (date) {
                return [
                    this.padTo2Digits(date.getDate()),
                    this.padTo2Digits(date.getMonth() + 1),
                    date.getFullYear(),
                ].join('.');
            },

        _setLocalTimeZoneZone: function (datevalue) {
                if (datevalue !== undefined && datevalue !== null && datevalue !== "") {
                    datevalue = new Date(datevalue);
                    var offSet = datevalue.getTimezoneOffset();
                    var offSetVal = datevalue.getTimezoneOffset() / 60;
                    var h = Math.floor(Math.abs(offSetVal));
                    var m = Math.floor((Math.abs(offSetVal) * 60) % 60);
                    datevalue = new Date(datevalue.setHours(h, m, 0, 0));
                    return datevalue;
                }
                return null;
            },

            getOriginalDateTime: function (dateTime) {
                if (dateTime !== undefined && dateTime !== null && dateTime !== "") {
                    var dateFormat = DateFormat.getInstance({
                        UTC: true,
                        pattern: "MM/dd/yyyy"
                    });
                    var originalDate = dateFormat.format(new Date(dateTime));
                    return originalDate;
                }
                return null;
            }

        });
    });

