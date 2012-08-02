﻿/*
* Copyright (C) 2012 Doubango Telecom <http://www.doubango.org>
*
* Contact: Mamadou Diop <diopmamadou(at)doubango[dot]org>
*	
* This file is part of Open Source sipML5 solution <http://www.sipml5.org>
*
* sipML5 is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as publishd by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*	
* sipML5 is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*	
* You should have received a copy of the GNU General Public License
* along with sipML5.
*/
// "http://tools.ietf.org/html/draft-uberti-rtcweb-jsep-02" implementation for Safari, Opera, Firefox and IE

w4aPeerConnection.prototype.s_configuration = null;
w4aPeerConnection.prototype.f_IceCallback = null;
w4aPeerConnection.prototype.o_peer = null;
w4aPeerConnection.prototype.localDescription = null; // part of the standard
w4aPeerConnection.prototype.remoteDescription = null; // part of the standard

w4aSessionDescription.prototype.o_sdp = null;

w4aIceCandidate.prototype.media = null;
w4aIceCandidate.prototype.label = null; // part of the standard


var WebRtcType_e =
{
    NONE: -1,

    NATIVE: 0,
    IE: 1,
    NPAPI: 2
};

var __webrtc_type = WebRtcType_e.NONE;
var __b_webrtc4all_initialized = false;
function WebRtc4all_Init() {
    if (!__b_webrtc4all_initialized) {
        try {
            // NPAPI plugin object
            var oWebRtc4npapi = document.createElement('embed');
            oWebRtc4npapi.id = "WebRtc4npapi";
            oWebRtc4npapi.type = "application/w4a";
            oWebRtc4npapi.width = oWebRtc4npapi.height = '1px';
            oWebRtc4npapi.stype = 'visibility:hidden;';
            document.body.appendChild(oWebRtc4npapi);
        }
        catch (e) { }

        // WebRtc plugin type
        try {
            if ((navigator.webkitGetUserMedia && (window.webkitPeerConnection || window.webkitPeerConnection00))) {
                __webrtc_type = WebRtcType_e.NATIVE; // Google Chrome
            }
        }
        catch (e) { }
        if (__webrtc_type == WebRtcType_e.NONE) {
            try {
                new ActiveXObject("webrtc4ie.PeerConnection");
                __webrtc_type = WebRtcType_e.IE; // Internet Explorer
            }
            catch (e) {
                if (WebRtc4npapi.supportsPeerConnection) {
                    __webrtc_type = WebRtcType_e.NPAPI; // Opera, Firefox or Safari
                }
            }
        }

        __b_webrtc4all_initialized = true;
    }
}

function WebRtc4all_GetType() {
    return __webrtc_type;
}

var __looper = undefined;
function WebRtc4all_GetLooper() {
    if (__looper == undefined) {
        try {
            var oLooper = document.createElement('object');
            oLooper.classid = "clsid:7082C446-54A8-4280-A18D-54143846211A";
            oLooper.width = oLooper.height = '1px';
            document.body.appendChild(oLooper);
            if (!(__looper = oLooper.hWnd)) {
                tsk_utils_log_error("Failed to create looper");
            }
        }
        catch (e) {
            tsk_utils_log_error(e);
            __looper = null;
        }
    }
    return __looper;
}

function WebRtc4all_SetDisplays(o_local_elt, o_remote_elt) {
    if (__webrtc_type == WebRtcType_e.IE) {
        // visiblity must be "visible"  for the first time to force handle creation
        if (o_local_elt) {
            o_local_elt.innerHTML = "<object id=\"__o_display_local\" classid=\"clsid:5C2C407B-09D9-449B-BB83-C39B7802A684\"" +
                                    " class=\"video\" width=\"88px\" height=\"72px\" style=\"margin-top: -80px; margin-left: 5px; background-color: #000000; visibility:visible\"> </object>";
            __o_display_local.style.visibility = "hidden";
        }
        if (o_remote_elt) {
            o_remote_elt.innerHTML = "<object id=\"__o_display_remote\" classid=\"clsid:5C2C407B-09D9-449B-BB83-C39B7802A684\"" +
                                     " width=\"100%\" height=\"100%\" style=\"visibility:visible;\"> </object>";
            __o_display_remote.style.visibility = "hidden";
        }
    }
    else if (__webrtc_type == WebRtcType_e.NPAPI) {
        if (o_local_elt) {
            o_local_elt.innerHTML = "<embed id=\"__o_display_local\" type=\"application/w4a-display\"" +
                                    " class=\"video\" width=\"88px\" height=\"72px\" style=\"margin-top: -80px; margin-left: 5px; background-color: #000000; visibility:hidden\"> </embed>";
        }
        if (o_remote_elt) {
            o_remote_elt.innerHTML = "<embed id=\"__o_display_remote\" type=\"application/w4a-display\"" +
                                     " width=\"100%\" height=\"100%\" style=\"visibility:hidden;\"> </embed>";
        }
    }
}

function w4aSessionDescription(s_sdp) {
    if (!__b_webrtc4all_initialized) {
        WebRtc4all_Init();
    }
    var b_isInternetExplorer = (__webrtc_type == WebRtcType_e.IE);
    this.o_sdp = b_isInternetExplorer ? new ActiveXObject("webrtc4ie.SessionDescription") : WebRtc4npapi.createSessionDescription();
    this.o_sdp.Init(s_sdp ? (s_sdp + "") : null);
}

w4aSessionDescription.prototype.toSdp = function () {
    return this.o_sdp.toSdp();
}
w4aSessionDescription.prototype.toString = w4aSessionDescription.prototype.toSdp;

w4aSessionDescription.prototype.addCandidate = function (o_candidate) {
    this.o_sdp.addCandidate(o_candidate.media, o_candidate.label);
}

function w4aIceCandidate(media, label) {
    this.media = media;
    this.label = label;
}

w4aIceCandidate.prototype.toSdp = function () {
    return this.label;
};

function w4aPeerConnection(s_configuration, f_IceCallback) {
    if (!__b_webrtc4all_initialized) {
        WebRtc4all_Init();
    }
    var This = this;
    var b_isInternetExplorer = (__webrtc_type == WebRtcType_e.IE);
    var h_wndLocal = (__o_display_local ? __o_display_local.hWnd : 0) + 0.0; // plus zero to convert from NPObject to double (Firfox issue)
    var h_wndRemote = (__o_display_remote ? __o_display_remote.hWnd : 0) + 0.0; // plus zero to convert from NPObject to double (Firfox issue)
    this.s_configuration = s_configuration;
    this.f_IceCallback = f_IceCallback;
    this.o_peer = b_isInternetExplorer ? new ActiveXObject("webrtc4ie.PeerConnection") : WebRtc4npapi.createPeerConnection();
    this.o_peer.Init(s_configuration);

    // attach displays if defined by the user
    try { this.o_peer.localVideo = (__o_display_local ? __o_display_local.hWnd : 0); } catch (e) { }
    try { this.o_peer.remoteVideo = (__o_display_remote ? __o_display_remote.hWnd : 0); } catch (e) { }

    // register callback function
    if (b_isInternetExplorer) {
        eval("function This.o_peer::IceCallback(media, label, bMoreToFollow) { return This.onIceCallback (media, label, bMoreToFollow); }");
    }
    else {
        this.o_peer.opaque = This;
        this.o_peer.setCallbackFuncName("w4aPeerConnection_NPAPI_OnEvent");
    }
};


// actions, for setLocalDescription/setRemoteDescription
w4aPeerConnection.SDP_OFFER = 0x100;
w4aPeerConnection.SDP_PRANSWER = 0x200;
w4aPeerConnection.SDP_ANSWER = 0x300;

// PeerConnection state
w4aPeerConnection.NEW = 0;     // initial state
w4aPeerConnection.OPENING = 1; // local or remote desc set
w4aPeerConnection.ACTIVE = 2;  // local and remote desc set
w4aPeerConnection.CLOSED = 3;  // ended state

// ICE state
w4aPeerConnection.ICE_GATHERING = 0x100;
w4aPeerConnection.ICE_WAITING = 0x200;
w4aPeerConnection.ICE_CHECKING = 0x300;
w4aPeerConnection.ICE_CONNECTED = 0x400;
w4aPeerConnection.ICE_COMPLETED = 0x500;
w4aPeerConnection.ICE_FAILED = 0x600;
w4aPeerConnection.ICE_CLOSED = 0x700;

// SessionDescription createOffer (MediaHints hints)
w4aPeerConnection.prototype.createOffer = function (o_hints) {
    if ((__webrtc_type == WebRtcType_e.IE)) {
        return new w4aSessionDescription(this.o_peer.createOffer(o_hints.has_audio, o_hints.has_video));
    }
    else {
        var oSdp = this.o_peer.createOffer(o_hints.has_audio, o_hints.has_video);
        if (oSdp) {
            return new w4aSessionDescription(oSdp.toSdp());
        }
        return null;
    }
}

// SessionDescription createAnswer (DOMString offer, MediaHints hints);
w4aPeerConnection.prototype.createAnswer = function (s_offer, o_hints) {
    if ((__webrtc_type == WebRtcType_e.IE)) {
        return new w4aSessionDescription(this.o_peer.createAnswer(o_hints.has_audio, o_hints.has_video));
    }
    else {
        var oSdp = this.o_peer.createAnswer(o_hints.has_audio, o_hints.has_video);
        if (oSdp) {
            return new w4aSessionDescription(oSdp.toSdp());
        }
        return null;
    }
}

// void setLocalDescription (unsigned short action, SessionDescription desc);
w4aPeerConnection.prototype.setLocalDescription = function (i_action, o_desc) {
    this.o_peer.setLocalDescription(i_action, (__webrtc_type == WebRtcType_e.IE) ? o_desc.toSdp() : o_desc.o_sdp);
    this.localDescription = new w4aSessionDescription(this.o_peer.localDescription);
}

// void setRemoteDescription (unsigned short action, SessionDescription desc);
w4aPeerConnection.prototype.setRemoteDescription = function (i_action, o_desc) {
    this.o_peer.setRemoteDescription(i_action, (__webrtc_type == WebRtcType_e.IE) ? o_desc.toSdp() : o_desc.o_sdp);
    this.remoteDescription = new w4aSessionDescription(this.o_peer.remoteDescription);
}

// void startIce (optional IceOptions options);
w4aPeerConnection.prototype.startIce = function (o_options) {
    this.o_peer.startIce(0/* all */, WebRtc4all_GetLooper());
}

// void processIceMessage (IceCandidate candidate);
w4aPeerConnection.prototype.processIceMessage = function (o_candidate) {
    tsk_utils_log_error("Not implemented"); // we expect all ICE candidates in the SDP offer (SIP)
}

// void addStream (MediaStream stream, MediaStreamHints hints);
w4aPeerConnection.prototype.addStream = function (o_stream, o_hints) {
}

// void removeStream (MediaStream stream);
w4aPeerConnection.prototype.removeStream = function (o_stream) {
}

// void close()
w4aPeerConnection.prototype.close = function () {
    if (this.o_peer) {
        this.o_peer.close();
    }
}

w4aPeerConnection.prototype.onIceCallback = function (media, label, bMoreToFollow) {
    tsk_utils_log_info("onIceCallback(" + media + "," + label + "," + bMoreToFollow + ")");
    this.iceState = this.o_peer.iceState;
    if (this.f_IceCallback) {
        this.f_IceCallback(new w4aIceCandidate(media, label), bMoreToFollow);
    }
}


function w4aPeerConnection_NPAPI_OnEvent(o_peer, sMedia, sLabel, bMoreToFollow) {
    o_peer.onIceCallback(sMedia, sLabel, bMoreToFollow);
}