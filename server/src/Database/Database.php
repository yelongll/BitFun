<?php

namespace Kongling\Server\Database;

class Database
{
    private $pdo = null;
    private $config;
    private $queryCount = 0;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function getConnection()
    {
        if ($this->pdo === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $this->config['host'],
                $this->config['port'],
                $this->config['database'],
                $this->config['charset']
            );

            $options = [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES => false,
                \PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->config['charset']}",
            ];

            $this->pdo = new \PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                $options
            );
        }

        return $this->pdo;
    }

    public function fetchOne($sql, array $params = [])
    {
        $stmt = $this->getConnection()->prepare($sql);
        $stmt->execute($params);
        $this->queryCount++;

        $result = $stmt->fetch();
        return $result ? $result : null;
    }

    public function fetchAll($sql, array $params = [])
    {
        $stmt = $this->getConnection()->prepare($sql);
        $stmt->execute($params);
        $this->queryCount++;

        return $stmt->fetchAll();
    }

    public function execute($sql, array $params = [])
    {
        $stmt = $this->getConnection()->prepare($sql);
        $stmt->execute($params);
        $this->queryCount++;

        return $stmt->rowCount();
    }

    public function insert($table, array $data)
    {
        $columns = implode(', ', array_map(function($col) { return "`$col`"; }, array_keys($data)));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        $sql = "INSERT INTO `$table` ($columns) VALUES ($placeholders)";
        $this->execute($sql, array_values($data));

        return (int)$this->getConnection()->lastInsertId();
    }

    public function update($table, array $data, $where, array $whereParams = [])
    {
        $setClauses = [];
        $values = [];
        foreach ($data as $column => $value) {
            $setClauses[] = "`$column` = ?";
            $values[] = $value;
        }

        $sql = "UPDATE `$table` SET " . implode(', ', $setClauses) . " WHERE $where";
        return $this->execute($sql, array_merge($values, $whereParams));
    }

    public function delete($table, $where, array $params = [])
    {
        $sql = "DELETE FROM `$table` WHERE $where";
        return $this->execute($sql, $params);
    }

    public function beginTransaction()
    {
        $this->getConnection()->beginTransaction();
    }

    public function commit()
    {
        $this->getConnection()->commit();
    }

    public function rollBack()
    {
        $this->getConnection()->rollBack();
    }

    public function inTransaction()
    {
        return $this->getConnection()->inTransaction();
    }

    public function getQueryCount()
    {
        return $this->queryCount;
    }
}
