sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/Fragment", "sap/m/MessageToast", "sap/ui/model/json/JSONModel"],
	function (Controller, Fragment, MessageToast, JSONModel) {
		"use strict";

		//controller
		var TPSController = Controller.extend("pomodoro.controller.View1", {

			onExit: function () {
				if (this._oDialog) {
					this._oDialog.destroy();
				}
			},
			//login fragments
			onOpenDialog: function () {
				var oData = new JSONModel();
				var oView = this.getView();
				var that = this;
				// create dialog lazily
				if (!this.byId("helloDialog")) {
					// load asynchronous XML fragment
					Fragment.load({
						id: oView.getId(),
						name: "pomodoro.view.Histories",
						controller: this
					}).then(function (oDialog) {
						// connect dialog to the root view of this component (models, lifecycle)
						oView.addDependent(oDialog);
						//						oDialog.open();
					});
				} else {
					//					this.byId("helloDialog").open();
				}

				$.ajax({
					type: "GET",
					async: true,
					url: "https://pomonode-grumpy-oribi-bv.cfapps.eu10.hana.ondemand.com/session/" + that.getView().byId("email").getValue(),
					success: function (res) {
						//						MessageToast.show(JSON.stringify(res));
						oData = res;
						MessageToast.show(JSON.stringify(oData));
					},
					error: function (res) {
						MessageToast.show("Oops!Something went wrong!");
					}
				});
				var oItem = new sap.m.StandardListItem({
					title: "{email}",
					description: "{time}",
					counter: "{id}"
				});
				var oList = new sap.m.List({
					headerText: " History",
					items: {
						path: "/",
						template: oItem
					}
				});
				oList.placeAt(this.getView().byId("helloDialog"));
			},
			//histories ok fragment
			historiesok: function () {
				this.byId("helloDialog").close();

			},

			//onenter
			onenter: function () {

				this.getView().byId("timer").setEnabled(true);
				this.getView().byId("email").setEnabled(false);
				//		this.getView().byId("email").setValue();
				this.getView().byId("enter").setEnabled(false);

			},

			//timefragmentopens
			handleOpenDialog: function (oEvent) {
				this.getView().byId("start").setEnabled(false);
				this.getView().byId("timer").setEnabled(false);
				// create popover
				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("fragment", "pomodoro.view.Timer", this);
					this.getView().addDependent(this._oDialog);
					this._oDialog.attachAfterOpen(function () {
						var oTP = Fragment.byId("fragment", "TPS2");

						this._sOldValue = oTP.getValue();
					}.bind(this));
				}
				Fragment.byId("fragment", "TPS2").setValue("00:00");
				this._oDialog.open();
			},

			onChange: function () {
				var email = this.getView().byId("email");
				var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
				if (!email.getValue().match(mailregex)) {
					//alert("Invalid Email");
					email.setValueState("Error");
					this.getView().byId("enter").setEnabled(false);
				} else {
					email.setValueState("None");
					this.getView().byId("enter").setEnabled(true);
				}
			},
			//ok button of  time fragment
			handleOKPress: function () {
				var oText = this.byId("T1"),

					oTP = Fragment.byId("fragment", "TPS2");

				this._oDialog.close();

				oText.setText(oTP.getValue());
				this.getView().byId("start").setEnabled(true);
				this.getView().byId("clear").setEnabled(true);

			},

			//cancel button of  time fragment
			handleCancelPress: function () {

				var oTP = Fragment.byId("fragment", "TPS2");

				oTP.setValue(this._sOldValue);

				this._oDialog.close();

				this.getView().byId("timer").setEnabled(true);
			},

			//start button		
			onstart: function () {

				this.getView().byId("clear").setEnabled(false);
				if (this.counter == undefined) {

					var oTP = Fragment.byId("fragment", "TPS2"); //to fetch value from time fragment
					var oText = this.byId("T1"); //using text

					var value = oTP.getValue(); //time from fragment is stored in value
					var otime = value.split(":"); //logic to split time as it is a string

					this.ominutes = parseInt(otime[0]); //minutes value of time
					this.oseconds = parseInt(otime[1]); //seconds value of time

					this.timer = (60 * this.ominutes) + this.oseconds; //converts the time into seconds

					this.getView().byId("start").setIcon("sap-icon://pause"); //convert start icon to pause

					var that = this;

					//logic of countdowntimer
					this.timeinterval = setInterval(function () {

						var minutes = parseInt(that.timer / 60, 10);
						var seconds = parseInt(that.timer % 60, 10);

						that.minutes = minutes < 10 ? "0" + minutes : minutes;
						that.seconds = seconds < 10 ? "0" + seconds : seconds;

						oText.setText(that.minutes + ":" + that.seconds); //countdown timer is displayed

						if (--that.timer < 0) {
							MessageToast.show("Time up!"); //when timer reaches zero timeup message is displayed
							that.getView().byId("timer").setEnabled(true);
							that.getView().byId("start").setIcon("sap-icon://play");
							that.getView().byId("start").setEnabled(false);
							that.timer = 0; //making timer zero to avoid negative value
							clearInterval(that.timeinterval);
						}
					}, 1000);

					this.counter = 1;

					var sEmail = this.getView().byId("email").getValue();
					var sTime = Fragment.byId("fragment", "TPS2").getValue();
					var oSession = new JSONModel();
					var d = new Date();
					oSession.setData({
						"id": d.toUTCString(),
						"email": sEmail,
						"time": sTime
					});

					//				MessageToast.show(JSON.stringify(oSession));
					$.ajax({
						type: "POST",
						async: true,
						url: "https://pomonode-grumpy-oribi-bv.cfapps.eu10.hana.ondemand.com/session",
						contentType: "application/json",
						data: oSession.getJSON(),
						success: function () {
							MessageToast.show("Ready!");
						},
						error: function (res) {
							MessageToast.show("Oops!Something went wrong!");
						}
					});

				} else if (this.counter === 1) {

					this.onpause(); //moves to pause function 

					this.counter++;
				} else {

					this.onresume(); //moves to resume function
					this.counter = 1;
				}

			},

			//to pause the countdown timer
			onpause: function () {

				clearInterval(this.timeinterval);
				this.getView().byId("start").setIcon("sap-icon://play"); //converts pause to resume
				if (this.getView().byId("stop").getEnabled() === false)
					this.getView().byId("stop").setEnabled(true);
			},

			onStop: function () {

				clearInterval(this.timeinterval);
				this.getView().byId("start").setIcon("sap-icon://play");
				var oText = this.byId("T1");
				oText.setText("00:00");
				Fragment.byId("fragment", "TPS2").setValue("00:00");
				this.getView().byId("timer").setEnabled(true);
				this.getView().byId("start").setEnabled(false);
				this.getView().byId("stop").setEnabled(false);
				this.counter = undefined;
			},

			onClear: function () {

				this.getView().byId("start").setEnabled(false);
				this.getView().byId("clear").setEnabled(false);
				this.getView().byId("timer").setEnabled(true);
				this.byId("T1").setText("00:00");
				Fragment.byId("fragment", "TPS2").setValue("00:00");

			},

			//to resume the countdown timer
			onresume: function () {

				this.getView().byId("start").setIcon("sap-icon://pause"); //converts resume to pause

				var oText = this.byId("T1");
				var that = this;

				//logic to start timer
				this.timeinterval = setInterval(function () {

					var minutes = parseInt(that.timer / 60, 10);
					var seconds = parseInt(that.timer % 60, 10);

					that.minutes = minutes < 10 ? "0" + minutes : minutes;
					that.seconds = seconds < 10 ? "0" + seconds : seconds;

					oText.setText(that.minutes + ":" + that.seconds); //countdown timer is displayed

					if (--that.timer < 0) {
						MessageToast.show("Time up!"); //when timer reaches zero timeup message is displayed
						that.getView().byId("timer").setEnabled(true);
						that.getView().byId("start").setIcon("sap-icon://play");
						that.getView().byId("start").setEnabled(false);
						that.timer = 0; //making timer zero to avoid negative value
						clearInterval(that.timeinterval);
					}
				}, 1000);

			}

		});

		return TPSController;

	});