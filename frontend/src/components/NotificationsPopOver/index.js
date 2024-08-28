import React, { useState, useRef, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { format } from "date-fns";
import useSound from "use-sound";

import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles } from "@material-ui/core/styles";
import Badge from "@material-ui/core/Badge";
import WhatsAppIcon from '@material-ui/icons/WhatsApp';

import TicketListItem from "../TicketListItem";
import { i18n } from "../../translate/i18n";
import useTickets from "../../hooks/useTickets";
import alertSound from "../../assets/sound.mp3";
import { AuthContext } from "../../context/Auth/AuthContext";
import { socketConnection } from "../../services/socket";

const useStyles = makeStyles((theme) => ({
  tabContainer: {
    overflowY: "auto",
    maxHeight: 350,
    ...theme.scrollbarStyles,
  },
  popoverPaper: {
    width: "100%",
    maxWidth: 350,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      maxWidth: 270,
    },
  },
  noShadow: {
    boxShadow: "none !important",
  },
  icons: {
    color: "#fff",
  },
  customBadge: {
    backgroundColor: "#34E23C",
    color: "#fff",
  },
}));

const NotificationsPopOver = ({ volume }) => {
  const classes = useStyles();

  const history = useHistory();
  const { user } = useContext(AuthContext);
  const ticketIdUrl = +history.location.pathname.split("/")[2];
  const ticketIdRef = useRef(ticketIdUrl);
  const anchorEl = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { profile, queues } = user;

  const [, setDesktopNotifications] = useState([]);

  const { tickets } = useTickets({ withUnreadMessages: "true" });
  const [play, { stop }] = useSound(alertSound, { volume });
  const soundAlertRef = useRef();
  const historyRef = useRef(history);

  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null); // Ref para armazenar o interval

  useEffect(() => {
    soundAlertRef.current = play;

    if (!("Notification" in window)) {
      console.log("This browser doesn't support notifications");
    } else {
      Notification.requestPermission();
    }
  }, [play]);

  useEffect(() => {
    const queueIds = queues.map((q) => q.id);
    const filteredTickets = tickets.filter(
      (t) => queueIds.indexOf(t.queueId) > -1
    );

    if (profile === "user") {
      setNotifications(filteredTickets);
    } else {
      setNotifications(tickets);
    }
  }, [tickets, queues, profile]);

  useEffect(() => {
    ticketIdRef.current = ticketIdUrl;
  }, [ticketIdUrl]);

  useEffect(() => {
    const soundLoopDuration = parseInt(process.env.REACT_APP_SOUND_LOOP); // Convertendo segundos para milissegundos
  
    if (notifications.length > 0 && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (notifications.length > 0) {
          play();
          setTimeout(stop, 5000); // Toca o som por 5 segundos
        }
      }, soundLoopDuration); // Intervalo configurado pelo valor da variável de ambiente
    } else if (notifications.length === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  
    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [notifications, play, stop]);
  

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    const queueIds = queues.map((q) => q.id);

    socket.on("connect", () => socket.emit("joinNotification"));

    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "updateUnread" || data.action === "delete") {
        setNotifications((prevState) => {
          const ticketIndex = prevState.findIndex(
            (t) => t.id === data.ticketId
          );
          if (ticketIndex !== -1) {
            const updatedNotifications = [...prevState];
            updatedNotifications.splice(ticketIndex, 1);
            return updatedNotifications;
          }
          return prevState;
        });

        setDesktopNotifications((prevState) => {
          const notificationIndex = prevState.findIndex(
            (n) => n.tag === String(data.ticketId)
          );
          if (notificationIndex !== -1) {
            prevState[notificationIndex].close();
            const updatedNotifications = [...prevState];
            updatedNotifications.splice(notificationIndex, 1);
            return updatedNotifications;
          }
          return prevState;
        });
      }
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
      if (
        data.action === "create" &&
        !data.message.read &&
        (data.ticket.userId === user?.id || !data.ticket.userId)
      ) {
        if (
          profile === "user" &&
          (queueIds.indexOf(data.ticket.queue?.id) === -1 ||
            data.ticket.queue === null)
        ) {
          return;
        }

        setNotifications((prevState) => {
          const ticketIndex = prevState.findIndex(
            (t) => t.id === data.ticket.id
          );
          if (ticketIndex !== -1) {
            const updatedNotifications = [...prevState];
            updatedNotifications[ticketIndex] = data.ticket;
            return updatedNotifications;
          }
          return [data.ticket, ...prevState];
        });

        const shouldNotNotificate =
          (data.message.ticketId === ticketIdRef.current &&
            document.visibilityState === "visible") ||
          (data.ticket.userId && data.ticket.userId !== user?.id) ||
          data.ticket.isGroup ||
          data.ticket.isBot;

        if (shouldNotNotificate) return;

        handleNotifications(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, profile, queues]);

  const handleNotifications = (data) => {
    const { message, contact, ticket } = data;

    const options = {
      body: `${message.body} - ${format(new Date(), "HH:mm")}`,
      icon: contact.profilePicUrl,
      tag: ticket.id,
      renotify: true,
    };

    const notification = new Notification(
      `${i18n.t("tickets.notification.message")} ${contact.name}`,
      options
    );

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      historyRef.current.push(`/tickets/${ticket.uuid}`);
    };

    setDesktopNotifications((prevState) => {
      const notificationIndex = prevState.findIndex(
        (n) => n.tag === notification.tag
      );
      if (notificationIndex !== -1) {
        prevState[notificationIndex] = notification;
        return [...prevState];
      }
      return [notification, ...prevState];
    });
  };

  const handleClick = () => {
    setIsOpen((prevState) => !prevState);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const NotificationTicket = ({ children }) => {
    return <div onClick={handleClickAway}>{children}</div>;
  };

  return (
    <>
      <IconButton
        className={classes.icons}
        onClick={handleClick}
        ref={anchorEl}
        aria-label="Open Notifications"
        variant="contained"
      >
        <Badge
          overlap="rectangular"
          badgeContent={notifications.length}
          classes={{ badge: classes.customBadge }}
        >
          <WhatsAppIcon />
        </Badge>
      </IconButton>
      <Popover
        disableScrollLock
        open={isOpen}
        anchorEl={anchorEl.current}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        classes={{ paper: classes.popoverPaper }}
        onClose={handleClickAway}
      >
        <List dense className={classes.tabContainer}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText>{i18n.t("notifications.noTickets")}</ListItemText>
            </ListItem>
          ) : (
            notifications.map((ticket) => (
              <NotificationTicket key={ticket.id}>
                <TicketListItem ticket={ticket} />
              </NotificationTicket>
            ))
          )}
        </List>
      </Popover>
    </>
  );
};

export default NotificationsPopOver;
