Parse.initialize("uFgE3rx2fcIDcWXQgjzuE70VF5WBH76I3TFkwo7W", "21lb7CMEkfLUurx1ETYa805EVu6KYU2WeluLIJ73");

function ParseSignup(username, password, email, name, errorObject, destID, customFunction) {
    var user = new Parse.User();
    user.set("username",username);
    user.set("password",password);
    user.set("email",email);
    user.set("name",name);

    user.signUp(null, {
        success: function(user) {
            setCurrLocationHash(destID);
            $.mobile.changePage(destID);//            window.location.hash = destID;
            customFunction(user);
        },
        error: function(user,error) {
            $.mobile.loading("hide");
            //errorObject.html("Error: " + error.code + " " + error.message);
            errorObject.html(error.message);
            $("#body-input-signup-password").val("");
        }
    });
}

function ParseUpdateBridgeit(bridgeitId){
    var current = Parse.User.current();

    current.set("bridgeitId",bridgeitId);
    current.save();
}

function ParseCreateProfilePhotoObject(userId){
    var Photo = Parse.Object.extend("Photo");
    var photo = new Photo;

    photo.set("userId",userId);
    photo.save();
}

function ParseLogin(username, password, errorObject, destID, customFunction) {
    Parse.User.logIn(username,password,{
        success: function(user){
            setCurrLocationHash(destID);
            $.mobile.changePage(destID); //window.location.hash = destID;
            customFunction();
            CacheUpdateUser(user);
        },
        error: function(user, error){
            $.mobile.loading("hide");
            $("#body-input-login-password").val("");
            var query = new Parse.Query(Parse.User);
            query.equalTo("username", username);
            query.find({
                  success: function(userlist) {
                      if(userlist.length == 0){
                          errorObject.html("Email does not exist.");
                      }else{
                           errorObject.html("Password does not match your email.");
                       }
                  },
                  error: function(){
                      errorObject.html("Failed to connect server, please try again.");
                  }
            });
        }
    });
}

function ParseConfirmPassword(password, successFunction, errorFunction) {
    Parse.User.logIn(Parse.User.current().getUsername(), password, {
        success: function(user){
            successFunction();
        },
        error: function(user, error){
            errorFunction(error);
        }
    });
}

function ParseChangePassword(newpassword, successFunction, errorFunction) {
    var currentUser = Parse.User.current();
    currentUser.set("password",newpassword);
    currentUser.save(null, {
        success: function(user){
            successFunction();
        },
        error: function(user, error){
            errorFunction(error);
        }
    });
}

function ParseRemoveCurrentBridgeitId() {
    var current = Parse.User.current();
    var empty;

    current.set("bridgeitId",empty);
    current.save();
}

function ParseLogout(destID) {
    Parse.User.logOut();
    setCurrLocationHash(destID);
    $.mobile.changePage(destID); //    window.location.hash = destID;
}

function ParseUpdateCurrentUser(successFunction, errorFunction) {
    var currentUser = Parse.User.current();
    currentUser.fetch({
        success: function(object) {
            successFunction();
            CacheUpdateUser(object);
        },
        error: function(object,error){
            errorFunction();
        }
    });
}

function ParseEventCreate(owner, title, location, time, visibility, description, errorObject, destID, displayFunction) {
    var UserEvent = Parse.Object.extend("UserEvent");
    var userEvent = new UserEvent();

    userEvent.set("owner",owner);
    userEvent.set("title",title);
    userEvent.set("location",location);
    userEvent.set("time",time);
    userEvent.set("visibility",visibility);
    userEvent.set("description",description);
    userEvent.set("commentNumber",0);
    userEvent.set("reportNum", 0);

    userEvent.save(null, {
        success: function(userEvent) {
            displayFunction(userEvent);
            $.mobile.changePage(destID); //            window.location.hash = destID;
        },
        error: function(userEvent, error){
            errorObject.html("Error: " + error.code + " " + error.message);
        }
    });
}

function ParseEventEditSave(owner, title, location, time, visibility, description, errorObject, destID, displayFunction, eventId) {
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);
    
    query.get(eventId, {
        success: function(userEvent){
            userEvent.set("owner",owner);
            userEvent.set("title",title);
            userEvent.set("location",location);
            userEvent.set("time",time);
            userEvent.set("visibility",visibility);
            userEvent.set("description",description);

            userEvent.save(null, {
                success: function(userEvent) {
                    displayFunction(userEvent);
                    $.mobile.changePage(destID); //            window.location.hash = destID;
                },
                error: function(userEvent, error){
                    errorObject.html("Error: " + error.code + " " + error.message);
                }
            });
        }
    });
}

function ParseUpdateReport(id, hiddenUserEvent){
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);
    query.get(id, {
        success: function(userEvent){
            userEvent.increment("reportNum",1);
            userEvent.addUnique("reportUserId", Parse.User.current().id);
            userEvent.save(null, {
                success: function(userEvent){
                    //hide the report event
                    hiddenUserEvent(userEvent);
                }
            });
        }
    });
}

function ParsePullEvent(obj) {
    //owner, limitNumber, descendingOrderKey, accessibility, beforeAt, displayFunction
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);
    if (("owner" in obj) && (obj.owner != null)) {
        query.equalTo("owner",obj.owner);
    }else{
        query.lessThan("reportNum", 11);
        query.notEqualTo("reportUserId", Parse.User.current().id);
    }
    if (("limitNumber" in obj) && (obj.limitNumber != null)) {
        query.limit(obj.limitNumber);
    }
    if (("accessibility" in obj) && (obj.accessibility != null)) {
        if (obj.accessibility == "public") {
            query.equalTo("visibility",true);
        }
    }
    if (("descendingOrderKey" in obj) && (obj.descendingOrderKey != null)) {
        query.descending(obj.descendingOrderKey);
    }
    
    if (("beforeAt" in obj) && (typeof(obj.beforeAt) != "undefined") && (obj.beforeAt != null)) {
        query.lessThan("createdAt",obj.beforeAt);
    }
    if(("eventId" in obj) && obj.eventId != null){
        query.equalTo("objectId", obj.eventId);
    }
    query.find({
        success: function(userEvents) {
            obj.displayFunction(userEvents);
        }
    });
}

function ParseSelectEvent(id, displayFunction) {
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);

    query.equalTo("objectId",id);
    query.find({
        success: function(userEvents) {
            displayFunction(userEvents);
        }
    });
}

function ParsePullEventComment(eventId, descendingOrderKey, displayFunction) {
    var comment = Parse.Object.extend("Comment");
    var query = new Parse.Query(comment);
    query.equalTo("eventId",eventId);
    query.ascending(descendingOrderKey);
    query.find({
        success: function(comments) {
            displayFunction(comments);
        }
    });
}

function ParseAddEventComment(eventId, owner, content, option) {
    var Comment = Parse.Object.extend("Comment");
    var comment = new Comment;
    var currentUser = Parse.User.current();
    
    comment.set("eventId", eventId);
    comment.set("owner",owner);
    comment.set("ownerName",currentUser.get("name"));
    comment.set("content",content);
    if (("replyToUserId" in option) && (option.replyToUserId != null)) {
        comment.set("replyToUserId", option.replyToUserId);
    }
    comment.save(null, {
        success: function(comment) {
            ParseUpdateEventCommentNumber(1, eventId, option);
        },
        error: function(comment, error){
            option.errorFunction("Error: " + error.code + " " + error.message);
        }
    });
}

function ParseUpdateEventCommentNumber(count, eventId, option){
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);
    
    query.get(eventId, {
        success: function(userEvent){
            userEvent.increment("commentNumber",count);
            userEvent.save(null, {
                success: function(userEvent){
                    option.successFunction(userEvent,option);
                },
                error: function(comment, error){
                    option.errorFunction("Error: " + error.code + " " + error.message);
                }
            });
        },
        error: function(comment, error){
            option.errorFunction("Error: " + error.code + " " + error.message);
        }
    });
}

function ParseAddInterest(eventId, displayFunction){
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);

    query.get(eventId, {
        success: function(object){
            object.addUnique("interestId",Parse.User.current().id);
            object.save(null, {
                success: function(object){
                    displayFunction(object);
                }
            });
        }
    });
}

function ParseRemoveInterest(eventId, displayFunction){
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);

    query.get(eventId, {
        success: function(object){
            object.remove("interestId",Parse.User.current().id);
            object.save(null, {
                success: function(object){
                    displayFunction(object);
                }
            });
        }
    });
}

function ParseAddGoing(eventId, displayFunction){
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);

    query.get(eventId, {
        success: function(object){
            object.addUnique("goingId",Parse.User.current().id);
            object.save(null, {
                success: function(object){
                    displayFunction(object);
                }
            });
        }
    });
}

function ParseRemoveGoing(eventId, displayFunction){
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);

    query.get(eventId, {
        success: function(object){
            object.remove("goingId",Parse.User.current().id);
            object.save(null, {
                success: function(object){
                    displayFunction(object);
                }
            });
        }
    });
}

function ParseDeleteEvent(eventId, displayFunction){
    var UserEvent = Parse.Object.extend("UserEvent");
    var query = new Parse.Query(UserEvent);
    query.get(eventId,{
        success: function(userEvent){
            userEvent.destroy({
                success: function(userEvent){
                    displayFunction(eventId);
                }
            });
        }
    });
}

function ParseGetProfileByUsername(username, displayFunction, data){
    var query = new Parse.Query(Parse.User);

    query.equalTo("username", username);
    query.first({
        success: function(user) {
            displayFunction(user, data);
            CacheUpdateUser(user);
        }
    });
}

function ParseGetProfileByUserId(userId, displayFunction, data){
    var query = new Parse.Query(Parse.User);

    query.equalTo("objectId", userId);
    query.first({
        success: function(user) {
            displayFunction(user, data);
            CacheUpdateUser(user);
        }
    });
}

function ParseSaveProfile(name, gender, birthdate, motto, major, school, interest, location, displayFunction) {
    var currentUser = Parse.User.current();
    
    currentUser.set("name",name);
    currentUser.set("gender",gender);
    currentUser.set("birthdate",birthdate);
    currentUser.set("motto",motto);
    currentUser.set("major",major);
    currentUser.set("school",school);
    currentUser.set("interest",interest);
    currentUser.set("location",location);
    currentUser.save(null,{
        success: function(object){
            displayFunction();
            CacheUpdateUser(object);
        }
    });
}

function ParseSaveProfilePhoto(id, photo, photo120, displayFunction) {
    var Photo = Parse.Object.extend("Photo");
    var query = new Parse.Query(Photo);

    if (photo == null)
        return;
    query.equalTo("userId",id);
    query.first({
        success: function(photoObject) {
            photoObject.set("profilePhoto120",photo120);
            var parseFile = new Parse.File(photo.name, photo);
            parseFile.save().then(function(object) {
                photoObject.set("profilePhoto",object.url());
                photoObject.save(null,{
                    success: function(object){
                        displayFunction(object);
                        CacheUpdatePhoto(object);
                    }
                });
            }, function(error) {
                
            });
        }
    })
}

function ParseGetProfilePhoto(userId, displayFunction, data) {
    var Photo = Parse.Object.extend("Photo");
    var query = new Parse.Query(Photo);

    query.equalTo("userId",userId);
    query.first({
        success: function(object){
            displayFunction(object, data);
            CacheUpdatePhoto(object);
        }
    })
}

function ParseGetProfilePhotoByUsername(username, displayFunction, data) {
    var User = Parse.Object.extend("User");
    var query = new Parse.Query(User);

    query.equalTo("username",username);
    query.first({
        success: function(object){
            ParseGetProfilePhoto(object.id, displayFunction, data);
        }
    })
}

function ParsePullUserByGeolocation(latitude,longitude,latitudeLimit,longitudeLimit,descendingOrderKey,displayFunction){
    var currentUser = Parse.User.current();
    currentUser.set("latitude",latitude);
    currentUser.set("longitude",longitude);
    currentUser.save();

    var query = new Parse.Query(Parse.User);
    query.notEqualTo("username", currentUser.getUsername());
    query.greaterThan("latitude",(latitude-latitudeLimit/2.0));
    query.lessThan("latitude",(latitude+latitudeLimit/2.0));
    query.greaterThan("longitude",(longitude-longitudeLimit/2.0));
    query.lessThan("longitude",(longitude+longitudeLimit/2.0));
    query.descending(descendingOrderKey);
    query.find({
        success: function(users){
            displayFunction(latitude,longitude,users);
        }
    });
}

function ParseSendFriendRequest(ownerId, friendId, successFunction){
    var Friend = Parse.Object.extend("Friend");
    var query = new Parse.Query(Friend);

    query.equalTo("owner", ownerId);
    query.equalTo("friend",friendId);
    query.first({
        success: function(object){
            if (typeof(object)=="undefined") {
                var friend = new Friend;

                friend.set("owner", ownerId);
                friend.set("friend", friendId);
                friend.set("valid",false);
                friend.set("read",false);
                friend.save(null, {
                    success: function(friend){
                        successFunction(friend);
                        CacheUpdateFriend(friend);
                    }
                })
            } else {
                successFunction(object);
                CacheUpdateFriend(object);
            }
        }
    })
}

function ParseAcceptFriendRequest(objectId, ownerId, friendId, successFunction){
    var Friend = Parse.Object.extend("Friend");
    var query = new Parse.Query(Friend);

    if (objectId != null) {
        query.equalTo("objectId",objectId);
    } else {
        query.equalTo("owner",ownerId);
        query.equalTo("friend",friendId);
    }
    query.first({
        success:function(object){
            // update current user"s friend data
            object.set("valid",true);
            object.set("read",true);
            object.save(null, {
                success: function(object){
                    CacheUpdateFriend(object);
                    // try to update frient"s data
                    var ownerId = object.get("friend");
                    var friendId = object.get("owner");
                    var query = new Parse.Query(Friend);

                    query.equalTo("owner",ownerId);
                    query.equalTo("friend",friendId);
                    query.first({
                        success: function(object){
                            if (typeof(object) == "undefined") {
                                // if friend's data doesn't exist
                                var friend = new Friend;

                                friend.set("owner",ownerId);
                                friend.set("friend",friendId);
                                friend.set("valid",true);
                                friend.set("read",true);
                                friend.save(null, {
                                    success: function(object){
                                        successFunction(object);
                                        CacheUpdateFriend(object);
                                    }
                                })
                            } else {
                                // if existed
                                object.set("valid",true);
                                object.set("read",true);
                                object.save(null,{
                                    success: function(object){
                                        successFunction(object);
                                        CacheUpdateFriend(object);
                                    }
                                })
                            }
                        }
                    })
                }
            });
        }
    })
}

function ParseRejectFriendRequest(objectId, ownerId, friendId, successFunction){
    var Friend = Parse.Object.extend("Friend");
    var query = new Parse.Query(Friend);

    if (objectId != null) {
        query.equalTo("objectId",objectId);
    } else {
        query.equalTo("owner",ownerId);
        query.equalTo("friend",friendId);
    }

    query.first({
        success:function(object){
            CacheRemoveFriend(object);
            object.destroy({
                success: function(object){
                    successFunction(friendId);
                }
            });
        }
    })
}

function ParsePullNewFriendRequest(userId, descendingOrderKey, displayFunction) {
    var Friend = Parse.Object.extend("Friend");
    var query = new Parse.Query(Friend);

    query.equalTo("friend",userId);
    query.equalTo("valid",false);
    query.descending(descendingOrderKey);
    query.find({
        success: function(objects){
            displayFunction(objects);
            for (var i = 0; i < objects.length; i++) {
                CacheUpdateFriend(objects[i]);
            }
        }
    })
}

function ParsePullUnreadFriendRequest(userId, displayFunction) {
    var Friend = Parse.Object.extend("Friend");
    var query = new Parse.Query(Friend);

    query.equalTo("friend",userId);
    query.equalTo("read",false);
    query.find({
        success: function(objects){
            displayFunction(objects);
            for (var i = 0; i < objects.length; i++) {
                CacheUpdateFriend(objects[i]);
            }
        }
    })
}


function ParseCheckFriend(ownerId, friendId, displayFunction) {
    var Friend = Parse.Object.extend("Friend");
    var query = new Parse.Query(Friend);

    query.equalTo("owner",ownerId);
    query.equalTo("friend",friendId);

    query.first({
        success: function(object){
            displayFunction(ownerId, friendId, object);
            CacheUpdateFriend(object);
        }
    })
}

function ParsePullMyFriend(ownerId, descendingOrderKey, displayFunction) {
    var Friend = Parse.Object.extend("Friend");
    var query = new Parse.Query(Friend);

    query.equalTo("owner",ownerId);
    query.equalTo("valid",true);
    query.descending(descendingOrderKey);

    query.find({
        success: function(objects){
            displayFunction(objects);
            for (var i = 0; i < objects.length; i++) {
                CacheUpdateFriend(objects[i]);
            }
        }
    })
}

function ParsePullAllFriendObjectById(ownerId){
    var Friend = Parse.Object.extend("Friend");
    var queryAsOwner = new Parse.Query(Friend);
    queryAsOwner.equalTo("owner",ownerId);
    var queryAsFriend = new Parse.Query(Friend);
    queryAsFriend.equalTo("friend",ownerId);
    var query = Parse.Query.or(queryAsOwner,queryAsFriend);

    query.find({
        success: function(objects){
            for (var i = 0; i < objects.length; i++) {
                CacheUpdateFriend(objects[i]);
            }
        }
    })
}

function ParseSearchUserByEmailAndName(string, limitNumber, descendingOrderKey, displayFunction){
    var queryByEmail = new Parse.Query(Parse.User);
    var queryByName = new Parse.Query(Parse.User);
    var currentUser = Parse.User.current();

    queryByEmail.matches("username",".*"+string+".*");
    queryByName.matches("name",".*"+string+".*");

    var query = Parse.Query.or(queryByEmail, queryByName);
    query.notEqualTo("username", currentUser.getUsername());
    query.descending(descendingOrderKey);
    if (limitNumber != null) {
        query.limit(limitNumber);
    }
    query.find({
        success: function(objects){
            displayFunction(objects);
        }
    })
}

function ParseSetRequestRead(objectId){
    var Friend = Parse.Object.extend("Friend");
    var query = new Parse.Query(Friend);

    query.get(objectId,{
        success:function(object){
            object.set("read",true);
            object.save();
        }
    })
}

function ParseGetGroupId(memberId, successFunction){
    var Group = Parse.Object.extend("Group");
    var query = new Parse.Query(Group);

    query.containsAll("memberId",memberId);
    query.equalTo("memberNum",memberId.length);
    query.first({
        success: function(object){
            if (typeof(object) == "undefined") {
                var group = new Group;
                group.set("memberId",memberId);
                group.set("memberNum",memberId.length);
                group.save(null,{
                    success: function(object){
                        successFunction(object);
                        CacheUpdateGroup(object)
                    }
                })
            } else {
                successFunction(object);
                CacheUpdateGroup(object)
            }
        }
    })
}

function ParseGetGroupMember(groupId, successFunction, data){
    var Group = Parse.Object.extend("Group");
    var query = new Parse.Query(Group);

    query.get(groupId,{
        success: function(object){
            successFunction(object, data);
            CacheUpdateGroup(object);
        }
    });
}

function ParseSetGroupName(groupId, groupName, displayFunction){
    var Group = Parse.Object.extend("Group");
    var query = new Parse.Query(Group);

    query.get(groupId,{
        success: function(object){
            object.set("groupName", groupName);
            object.save(null,{
                success: function(object){
                    displayFunction(object);
                    CacheUpdateGroup(object);
                }
            })
        }
    })
}

function ParseSetChatObjectAsRead(ownerId, groupId, count, successFunction){
    var Chat = Parse.Object.extend("Chat");
    var query = new Parse.Query(Chat);

    query.equalTo("ownerId",ownerId);
    query.equalTo("groupId",groupId);
    query.first({
        success: function(object){
            if (typeof(object) == "undefined") {
                var chat = new Chat;
                chat.set("ownerId",ownerId);
                chat.set("groupId",groupId);
                chat.set("hidden",true);
                chat.set("unreadNum",0);
                chat.save(null, {
                    success: function(object){
                        successFunction(object);
                        CacheUpdateChat(object);
                    }
                });
            } else {
                if (count == null) {
                    count = object.get("unreadNum");
                }
                if (count != 0) {
                    object.increment("unreadNum",-count);
                    object.set("hidden",false);
                    object.save(null,{
                        success: function(object){
                            successFunction(object);
                            CacheUpdateChat(object);
                        }
                    });
                } else {
                    successFunction(object);
                    CacheUpdateChat(object);
                }
            }
        }
    })
}

function ParseInitializeChatObjectInGroup(obj){
    //obj = {groupId:groupId, ownerId:memberId[i]});
    var Chat = Parse.Object.extend("Chat");
    var query = new Parse.Query(Chat);

    query.equalTo("ownerId",obj.ownerId);
    query.equalTo("groupId",obj.groupId);
    query.first({
        success: function(object) {
            if (typeof(object) == "undefined") {
                var Chat = Parse.Object.extend("Chat");
                var chat = new Chat;
                chat.set("ownerId", obj.ownerId);
                chat.set("groupId", obj.groupId);
                chat.set("hidden", false);
                chat.set("unreadNum",0);
                chat.save(null, {
                    success: function(object) {
                        CacheUpdateChat(object);
                        obj.successFunction(object);
                    }
                });
            } else {
                CacheUpdateChat(object);
                obj.successFunction(object);
            }
        }
    })
}

function ParsePullChatMessage(groupId, limitNum, descendingOrderKey, beforeAt, displayFunction, data) {
    var Message = Parse.Object.extend("Message");
    var query = new Parse.Query(Message);

    query.equalTo("groupId",groupId);
    query.descending(descendingOrderKey);
    if (beforeAt != null) {
        query.lessThan("createdAt", beforeAt);
    }
    query.limit(limitNum);
    query.find({
        success: function(objects){
            displayFunction(objects, data);
            for (var i = 0; i < objects.length; i++) {
                CacheUpdateMessage(objects[i]);
            }
        }
    })
}

function ParsePullAllMessageByGroupIdForCache(groupId, limitNum, beforeAt, displayFunction){
    var Message = Parse.Object.extend("Message");
    var query = new Parse.Query(Message);

    query.equalTo("groupId",groupId);
    query.find({
        success: function(objects){
            for (var i = 0; i < objects.length; i++) {
                CacheUpdateMessage(objects[i]);
            }
            CachePullChatMessage(groupId, limitNum, beforeAt, displayFunction);
        }
    })
}

function ParseAddChatMessage(senderId, groupId, text, displayFunction){
    var Message = Parse.Object.extend("Message");
    var message = new Message;

    message.set("senderId",senderId);
    message.set("groupId", groupId);
    message.set("text", text);
    message.save(null, {
        success: function(object){
            displayFunction(object);
            CacheUpdateMessage(object)
        }
    })
}

function ParseSetChatObjectReadFalseByCurrentIndexAndGroupId(senderId, memberId, currentIndex, groupId, text, notificationFunction) {
    var Chat = Parse.Object.extend("Chat");
    var query = new Parse.Query(Chat);
    var ownerId = memberId[currentIndex];
    query.equalTo("ownerId", ownerId);
    query.equalTo("groupId", groupId);
    if (senderId != ownerId) {
        // if the member of group isn't the sender
        query.first({
            success:function(object){
                if (typeof(object) == "undefined") {
                    // create new chat object for members of group
                    var chat = new Chat;
                    chat.set("ownerId", ownerId);
                    chat.set("groupId", groupId);
                    chat.set("hidden", false);
                    chat.set("unreadNum", 1);
                    chat.save(null,{
                        success: function(object) {
                            notificationFunction(senderId,text,ownerId);
                            if (currentIndex + 1 < memberId.length) {
                                ParseSetChatObjectReadFalseByCurrentIndexAndGroupId(senderId, memberId, currentIndex+1, groupId, text, notificationFunction);
                            }
                        }
                    });
                } else {
                    // set unread number plus 1 for chat object
                    object.increment("unreadNum", 1);
                    object.set("hidden", false);
                    object.save(null, {
                        success: function(object) {
                            notificationFunction(senderId,text,ownerId);
                            if (currentIndex + 1 < memberId.length) {
                                ParseSetChatObjectReadFalseByCurrentIndexAndGroupId(senderId, memberId, currentIndex+1, groupId, text, notificationFunction);
                            }
                        }
                    });
                }
            }
        })
    } else {
        // if the member is the sender
        query.first({
            success: function(object){
                object.set("hidden", false);
                object.save(null, {
                    success: function(object) {
                        CacheUpdateChat(object);
                        if (currentIndex + 1 < memberId.length) {
                            ParseSetChatObjectReadFalseByCurrentIndexAndGroupId(senderId, memberId, currentIndex+1, groupId, text, notificationFunction);
                        }
                    }
                })
            }
        })
    }
}

function ParseSetGroupMemberChatObjectReadFalse(senderId, groupId, text, notificationFunction) {
    var Group = Parse.Object.extend("Group");
    var query = new Parse.Query(Group);

    query.equalTo("objectId",groupId);
    query.first({
        success: function(object){
            // get the group members' id
            CacheUpdateGroup(object);
            var memberId = object.get("memberId");
            ParseSetChatObjectReadFalseByCurrentIndexAndGroupId(senderId, memberId, 0, groupId, text, notificationFunction);
        }
    })
}

function ParsePullMyChat(ownerId,descendingOrderKey,displayFunction){
    var Chat = Parse.Object.extend("Chat");
    var query = new Parse.Query(Chat);

    query.equalTo("ownerId",ownerId);
    query.equalTo("hidden",false);
    query.descending(descendingOrderKey);
    query.find({
        success: function(objects){
            displayFunction(objects);
            for (var i=0; i<objects.length; i++) {
                CacheUpdateChat(objects[i]);
            }
        }
    })
}

function ParsePullUnreadChat(ownerId, descendingOrderKey, displayFunction){
    var Chat = Parse.Object.extend("Chat");
    var query = new Parse.Query(Chat);

    query.equalTo("ownerId",ownerId);
    query.equalTo("hidden",false);
    query.descending(descendingOrderKey);
    query.greaterThan("unreadNum",0);
    query.find({
        success: function(objects){
            displayFunction(objects);
            for (var i=0; i<objects.length; i++) {
                CacheUpdateChat(objects[i]);
            }
        }
    })
}

// maintain cached array
function ParseUpdateCache(className, updateIdList,lastUpdate){
    var ClassObject = Parse.Object.extend(className);
    var query = new Parse.Query(ClassObject);

    query.containedIn("objectId",updateIdList);
    query.greaterThan("updatedAt",lastUpdate);
    query.find({
        success: function(objects){
            //console.log(className+": "+lastUpdate.toJSON()+" "+objects.length);
            for (var i = 0; i < objects.length; i++) {
                switch(className) {
                    case "Photo":
                        CacheUpdatePhoto(objects[i]);
                        break;
                    case "User":
                        CacheUpdateUser(objects[i]);
                        break;
                    case "Friend":
                        CacheUpdateFriend(objects[i]);
                        break;
                    case "Chat":
                        CacheUpdateChat(objects[i]);
                        break;
                    case "Group":
                        CacheUpdateGroup(objects[i]);
                        break;
                    case "Message":
                        CacheUpdateMessage(objects[i]);
                        break;
                    default:
                }
            }
        }
    })
}

function ParseUpdateGCMId(regid, displayFunction){
    var currentUser = Parse.User.current();

    currentUser.set("GCMId",regid.toString());
    currentUser.save(null,{
        success: function(object){
            displayFunction(object);
            CacheUpdateUser(object);
        }
    })
}

function ParseUpdateAPNId(regid, displayFunction){
    var currentUser = Parse.User.current();

    currentUser.set("APNId",regid.toString());
    currentUser.save(null,{
        success: function(object){
            displayFunction(object);
            CacheUpdateUser(object);
        }
    })
}

// functions for database maintaining /never used in front-end script.
function ParseUserNameFieldUpdate(i){
    var Comment = Parse.Object.extend("Comment");
    var query = new Parse.Query(Comment);

    query.descending("createdAt");
    query.find({
        success: function(comments){
                var query = new Parse.Query(Parse.User);
                var userid = comments[i].get("owner");
                var objectId = comments[i].id;
                //console.log(email);
                query.equalTo("obejctId", userid);
                query.find({
                    success: function(user){
                        var ownerName = user[0].get("name");
                        //console.log(ownerName);
                        var Comment = Parse.Object.extend("Comment");
                        var query = new Parse.Query(Comment);
                        query.get(objectId,{
                            success: function(comment){
                                //console.log(ownerName);
                                comment.set("ownerName",ownerName);
                                comment.save(null, {
                                    success: function(comments){
                                        //console.log("success");
                                    }
                                });
                            },
                            error: function(comment, error){
                                //console.log("Error: " + error.code + " " + error.message);
                            }
                        });
                    },
                    error: function(userEvent, error){
                        //console.log("Error: " + error.code + " " + error.message);
                    }
                })
        }
    })
}

var refreshNumber=0;
var ChatObjectSet;

function ParseRefreshComment(){
    ParseOwnerFieldUpdate();
    refreshNumber = refreshNumber+1;
    if (refreshNumber == 293)
        return;
    setTimeout(function(){
        ParseRefreshComment();
    }, 1000);
}

function ParseOwnerFieldUpdate(){
    var Comment = Parse.Object.extend("Comment");
    var query = new Parse.Query(Comment);

    query.descending("createdAt");
    query.find({
        success: function(objects) {
            var username = objects[refreshNumber].get("owner");
            var displayFunction = function(object, data){
                data.comment.set("owner", object.id);
                data.comment.save(null, {
                    success: function(object) {
                        console.log(object.get('owner'));
                    }
                });
            }
            CacheGetProfileByUsername(username, displayFunction, {comment: objects[refreshNumber]});
        }
    });
}

function ParsePhotoClassCreateBaseUserObject(i){
    var query = new Parse.Query(Parse.User);
    query.descending("createdAt");
    query.find({
        success: function(user) {
            //console.log(i);
            var userId = user[i].id;
            var profilePhoto = user[i].get("photo");
            var profilePhoto120 = user[i].get("photo50");
            //console.log(userId);
            //console.log(profilePhoto);
            //console.log(profilePhoto120);
            var Photo = Parse.Object.extend("Photo");
            var photo = new Photo;

            photo.set("userId",userId);
            photo.set("profilePhoto",profilePhoto);
            photo.set("profilePhoto120",profilePhoto120);
            photo.save(null,{
                success: function() {
                    //console.log('success');
                }
            })
        }
    })
}

function ParseRefreshUserProfilePhoto() {
    ParsePhotoClassCreateBaseUserObject(refreshNumber);
    refreshNumber = refreshNumber + 1;
    if (refreshNumber == 16)
        return
    setTimeout(function(){
        ParseRefreshUserProfilePhoto();
    }, 5000);
}

function ParseClearChatWithoutMessage() {
    var Chat = Parse.Object.extend("Chat");
    var query = new Parse.Query(Chat);

    query.find({
        success: function(objects) {
            ChatObjectSet = objects;
            ParseCheckChatObject();
        }
    })
}

function ParseCheckChatObject() {
    var object = ChatObjectSet[refreshNumber];
    var groupId = object.get("groupId");
    var Message = Parse.Object.extend("Message");
    var query = new Parse.Query(Message);

    query.descending("createdAt");
    query.equalTo("groupId",groupId);
    query.first({
        success: function(object){
            if (typeof(object) == "undefined") {
                ChatObjectSet[refreshNumber].set("hidden",true);
                ChatObjectSet[refreshNumber].save({
                    success: function(){
                        //console.log("hidden:" + ChatObjectSet[refreshNumber].id)
                    }
                })
            }
        }
    });

    if (refreshNumber == ChatObjectSet.length - 1)
        return;
    setTimeout(function(){
        //console.log(ChatObjectSet[refreshNumber].id);
        refreshNumber += 1;
        ParseCheckChatObject();
    },5000)
}

var NoticeNewVersionObjects;

function ParseNoticeNewVersion() {
    var User = Parse.Object.extend("User");
    var query = new Parse.Query(User);

    //query.equalTo("objectId", Parse.User.current().id);
    query.find({
        success: function(objects){
            NoticeNewVersionObjects = objects;
            SendNewVersionNotification(0);
        }
    })
}

function SendNewVersionNotification(i) {
    if (i >= NoticeNewVersionObjects.length)
        return
    var object = NoticeNewVersionObjects[i];
    console.log(object.id);
    if (typeof(object.get("GCMId")) != "undefined") {
        pushNotificationToDevice("gcm", object.get("GCMId"), "New version is available.");
        console.log("GCMId:" + object.get("GCMId"));
    }
    if (typeof(object.get("APNId")) != "undefined") {
        pushNotificationToDevice("apn", object.get("APNId"), "New version is available.");
        console.log("APNId:" + object.get("APNId"));
    }
    setTimeout(function(){
        SendNewVersionNotification(i+1)
    }, 1000);
}