import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
  Divider,
  ListSubheader,
  Typography
} from "@material-ui/core";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  LiveHelp as LiveHelpIcon,
  MailOutline as MailOutlineIcon,
  CalendarToday,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  DashboardOutlined as DashboardOutlinedIcon,
  WhatsApp as WhatsAppIcon,
  SyncAlt as SyncAltIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  PeopleAltOutlined as PeopleAltOutlinedIcon,
  ContactPhoneOutlined as ContactPhoneOutlinedIcon,
  AccountTreeOutlined as AccountTreeOutlinedIcon,
  FlashOn as FlashOnIcon,
  HelpOutline as HelpOutlineIcon,
  CodeRounded as CodeRoundedIcon,
  EventAvailable as EventAvailableIcon,
  ListAlt as ListIcon,
  Announcement as AnnouncementIcon,
  Forum as ForumIcon,
  LocalAtm as LocalAtmIcon,
  Business as BusinessIcon,
  StarOutline as StarOutlineIcon,
  AddToQueueRounded,
  LoyaltyRounded,
  RotateRight,
} from "@material-ui/icons";

import { i18n } from "../translate/i18n";
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { Can } from "../components/Can";
import { socketConnection } from "../services/socket";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import usePlans from "../hooks/usePlans";
import useVersion from "../hooks/useVersion";
import logo from "../assets/logo.png";

const useStyles = makeStyles((theme) => ({
  listItem: {
    borderRadius: 10,
    margin: "5px 0",
    background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
    color: "#fff",
    "&:hover": {
      backgroundColor: "#FF8E53",
      boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
    },
  },
  subMenu: {
    paddingLeft: 15,
    borderLeft: `2px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
  },
  logoutButton: {
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: theme.palette.error.main,
    color: "#fff",
    "&:hover": {
      backgroundColor: theme.palette.error.dark,
    },
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
  header: {
    background: "linear-gradient(to right, #6a11cb 0%, #2575fc 100%)",
    color: "#fff",
    padding: theme.spacing(2),
    borderRadius: 10,
    marginBottom: theme.spacing(2),
  },
  version: {
    fontSize: "12px",
    textAlign: "right",
    fontWeight: "bold",
    color: "#fff",
  },
}));

function ListItemLink(props) {
  const { icon, primary, to, className } = props;
  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );
  return (
    <li>
      <ListItem button component={renderLink} className={className}>
        {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];
    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }
    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);
    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = (props) => {
  const classes = useStyles();
  const { drawerClose } = props;
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);
  const [openKanbanSubmenu, setOpenKanbanSubmenu] = useState(false);
  const [openEmailSubmenu, setOpenEmailSubmenu] = useState(false);

  const history = useHistory();

  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const [version, setVersion] = useState(false);

  const { getPlanCompany } = usePlans();
  const { getVersion } = useVersion();

  const handleClickLogout = () => {
    handleLogout();
  };

  useEffect(() => {
    async function fetchVersion() {
      const _version = await getVersion();
      setVersion(_version.version);
    }
    fetchVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      const companyId = localStorage.getItem("companyId");
      const planConfigs = await getPlanCompany(undefined, companyId);
      setShowCampaigns(planConfigs.plan.useCampaigns);
      setShowSchedules(planConfigs.plan.useSchedules);
      setShowInternalChat(planConfigs.plan.useInternalChat);
      setShowExternalApi(planConfigs.plan.useExternalApi);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div onClick={drawerClose}>
      <div className={classes.header}>
       
      </div>
      <Can
        role={user.profile}
        perform="dashboard:view"
        yes={() => (
          <ListItemLink to="/" primary="Dashboard" icon={<DashboardOutlinedIcon />} className={classes.listItem} />
        )}
      />
      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={<WhatsAppIcon />}
        className={classes.listItem}
      />
      <ListItem button onClick={() => setOpenEmailSubmenu((prev) => !prev)} className={classes.listItem}>
        <ListItemIcon>
          <MailOutlineIcon />
        </ListItemIcon>
        <ListItemText primary={i18n.t("Email")} />
        {openEmailSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItem>
      <Collapse in={openEmailSubmenu} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemLink
            to="/Email"
            primary={i18n.t("Enviar")}
            icon={<SendIcon />}
            className={classes.nested}
          />
          <ListItemLink
            to="/EmailLis"
            primary={i18n.t("Enviados")}
            icon={<EventIcon />}
            className={classes.nested}
          />
          <ListItemLink
            to="/EmailScheduler"
            primary={i18n.t("Agendar")}
            icon={<ScheduleIcon />}
            className={classes.nested}
          />
          <ListItemLink
            to="/EmailsAgendado"
            primary={i18n.t("Agendados")}
            icon={<ScheduleIcon />}
            className={classes.nested}
          />
        </List>
      </Collapse>
      <ListItem button onClick={() => setOpenKanbanSubmenu((prev) => !prev)} className={classes.listItem}>
        <ListItemIcon>
          <DashboardOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary={i18n.t("Kanban")} />
        {openKanbanSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItem>
      <Collapse in={openKanbanSubmenu} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItemLink
            to="/kanban"
            primary={i18n.t("Painel")}
            icon={<ListIcon />}
            className={classes.nested}
          />
          <ListItemLink
            to="/tagsKanban"
            primary={i18n.t("Tags")}
            icon={<CalendarToday />}
            className={classes.nested}
          />
          <ListItemLink
            to="/campanhas"
            primary={i18n.t("Em Andamento")}
            icon={<EventAvailableIcon />}
            className={classes.nested}
          />
        </List>
      </Collapse>
      <ListItemLink
        to="/quick-messages"
        primary={i18n.t("mainDrawer.listItems.quickMessages")}
        icon={<SyncAltIcon />}
        className={classes.listItem}
      />
      <ListItemLink
        to="/contacts"
        primary={i18n.t("mainDrawer.listItems.contacts")}
        icon={<PeopleAltOutlinedIcon />}
        className={classes.listItem}
      />
      <ListItemLink
        to="/todolist"
        primary={i18n.t("Tarefas")}
        icon={<FlashOnIcon />}
        className={classes.listItem}
      />
      <ListItemLink
        to="/Calendario"
        primary={i18n.t("Calendario")}
        icon={<CalendarToday />}
        className={classes.listItem}
      />
      {showSchedules && (
        <ListItemLink
          to="/schedules"
          primary={i18n.t("mainDrawer.listItems.schedules")}
          icon={<EventIcon />}
          className={classes.listItem}
        />
      )}
      <ListItemLink
        to="/tags"
        primary={i18n.t("mainDrawer.listItems.tags")}
        icon={<ContactPhoneOutlinedIcon />}
        className={classes.listItem}
      />
      {showInternalChat && (
        <ListItemLink
          to="/chats"
          primary={i18n.t("mainDrawer.listItems.chats")}
          icon={
            <Badge color="secondary" variant="dot" invisible={invisible} overlap="rectangular">
              <ForumIcon />
            </Badge>
          }
          className={classes.listItem}
        />
      )}
      <ListItemLink
        to="/ChatGPT"
        primary={i18n.t("ChatGPT")}
        icon={<LiveHelpIcon />}
        className={classes.listItem}
      />
      <ListItemLink
        to="/helps"
        primary={i18n.t("mainDrawer.listItems.helps")}
        icon={<HelpOutlineIcon />}
        className={classes.listItem}
      />
      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            <Divider />
            <ListItem
              dense
              button
              onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
              className={classes.listItem}
            >
              <ListItemIcon>
                <StarOutlineIcon />
              </ListItemIcon>
              <ListItemText primary={i18n.t("mainDrawer.listItems.campaigns")} />
              {openCampaignSubmenu ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
            <Collapse in={openCampaignSubmenu} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemLink
                  to="/campaigns"
                  primary="Listagem"
                  icon={<ListIcon />}
                  className={classes.nested}
                />
                <ListItemLink
                  to="/contact-lists"
                  primary="Listas de Contatos"
                  icon={<ContactPhoneOutlinedIcon />}
                  className={classes.nested}
                />
                <ListItemLink
                  to="/campaigns-config"
                  primary="Configurações"
                  icon={<SettingsOutlinedIcon />}
                  className={classes.nested}
                />
              </List>
            </Collapse>
            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={i18n.t("mainDrawer.listItems.annoucements")}
                icon={<AnnouncementIcon />}
                className={classes.listItem}
              />
            )}
            {user.super && (
              <ListItemLink
                to="/campanhaAvancada"
                primary={i18n.t("Campanha Avancada")}
                icon={<PlaylistAddCheckIcon />}
                className={classes.listItem}
              />
            )}
            {showExternalApi && (
              <ListItemLink
                to="/messages-api"
                primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                icon={<FlashOnIcon />}
                className={classes.listItem}
              />
            )}
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<PeopleAltOutlinedIcon />}
              className={classes.listItem}
            />
            <ListItemLink
              to="/queues"
              primary={i18n.t("mainDrawer.listItems.queues")}
              icon={<AccountTreeOutlinedIcon />}
              className={classes.listItem}
            />
            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge badgeContent={connectionWarning ? "!" : 0} color="error" overlap="rectangular">
                  <SyncAltIcon />
                </Badge>
              }
              className={classes.listItem}
            />
            <ListItemLink
              to="/ratings"
              primary={i18n.t("mainDrawer.listItems.ratings")}
              icon={<StarOutlineIcon />}
              className={classes.listItem}
            />
            <ListItemLink
              to="/integrations"
              primary="Integrações"
              icon={<AddToQueueRounded />}
              className={classes.listItem}
            />
            <ListItemLink
              to="/financeiro"
              primary={i18n.t("mainDrawer.listItems.financeiro")}
              icon={<LocalAtmIcon />}
              className={classes.listItem}
            />
            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<SettingsOutlinedIcon />}
              className={classes.listItem}
            />
            {user.super && (
              <ListSubheader inset>{i18n.t("mainDrawer.listItems.administration")}</ListSubheader>
            )}
            {user.super && (
              <ListItemLink
                to="/companies"
                primary={i18n.t("mainDrawer.listItems.companies")}
                icon={<BusinessIcon />}
                className={classes.listItem}
              />
            )}
            <Divider />
            <Typography className={classes.version}>V:{version}</Typography>
          </>
        )}
      />
      <Divider />
      <ListItem button dense onClick={handleClickLogout} className={classes.logoutButton}>
        <ListItemIcon>
          <RotateRight />
        </ListItemIcon>
        <ListItemText primary={i18n.t("Sair")} />
      </ListItem>
    </div>
  );
};

export default MainListItems;
